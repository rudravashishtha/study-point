"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUser } from "@/lib/auth/permissions";
import { roleHome } from "@/lib/auth/route-guards";
import { rateLimit } from "@/lib/rate-limit";
import { publicEnv } from "@/lib/env";
import { db } from "@/lib/db";
import { AppUserStatus } from "@prisma/client";

const credentials = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };
  }

  const { success: loginOk } = rateLimit(
    `login:${parsed.data.email.toLowerCase()}`,
    10,
    15 * 60_000,
  );
  if (!loginOk) {
    return { error: "Too many attempts. Please try again later." };
  }

  const supabase = await createClient();

  let data;
  let error;
  try {
    ({ data, error } = await supabase.auth.signInWithPassword(parsed.data));
  } catch {
    return { error: "Unable to sign in right now. Please try again." };
  }

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const appUser = await getAppUser();
  if (!appUser) {
    return {
      error: "This account is not provisioned. Contact your administrator.",
    };
  }

  // Best-effort: if the user set their password but the INVITED→ACTIVE flip
  // failed earlier, complete it now.
  if (appUser.status === AppUserStatus.INVITED) {
    try {
      await db.appUser.update({
        where: { id: appUser.id },
        data: { status: AppUserStatus.ACTIVE },
      });
    } catch {
      // Non-fatal: routing self-heals from the database state.
    }
  }

  const role = appUser.role;

  // Best-effort: keep the JWT claim in sync so proxy.ts routing is accurate.
  // Server-side authorization (getAppUser / requireRole) remains the source of truth.
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(data.user.id, {
      app_metadata: { role },
    });
  } catch {
    // Non-fatal: routing self-heals and DB authorization still governs access.
  }

  redirect(roleHome(role));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const setPasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function updatePassword(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const parsed = setPasswordSchema.safeParse({
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { error: "Your session has expired. Request a new link." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (updateError) {
    return { error: "Could not update your password. Please try again." };
  }

  // Security refinement: re-verify the auth session is still valid and the
  // AppUser exists before changing application state. Only then flip
  // INVITED -> ACTIVE. The database AppUser remains the source of truth.
  const appUser = await getAppUser();
  if (appUser && appUser.status === AppUserStatus.INVITED) {
    try {
      await db.appUser.update({
        where: { id: appUser.id },
        data: { status: AppUserStatus.ACTIVE },
      });
    } catch {
      // Non-fatal: the password was set; the status flip can be retried on
      // next login. Routing self-heals from the database state.
    }
  }

  await supabase.auth.signOut({ scope: "global" });
  redirect("/login?reset=success");
}

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function requestPasswordReset(
  _prev: { error: string | null; sent?: boolean },
  formData: FormData,
): Promise<{ error: string | null; sent?: boolean }> {
  const parsed = forgotSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  }

  const { success: resetOk } = rateLimit(
    `forgot:${parsed.data.email.toLowerCase()}`,
    5,
    15 * 60_000,
  );
  if (!resetOk) {
    return { error: "Too many requests. Please try again later." };
  }

  const supabase = await createClient();
  const base = publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${base}/auth/callback?next=/reset-password`,
    });
  } catch {
    // Swallow: always return the generic response to avoid email enumeration.
  }

  return { error: null, sent: true };
}

const signUpAdminSchema = z
  .object({
    fullName: z.string().min(1, "Name is required."),
    email: z.string().email("Enter a valid email address."),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters.")
      .max(128, "Password is too long.")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
      .regex(/[0-9]/, "Password must contain at least one number.")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character."),
    confirmPassword: z.string(),
    registrationKey: z.string().min(1, "Registration key is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

/**
 * Validates if the current environment allows creating an admin account with the given key.
 * Abstracted for future organization invite flows.
 */
async function canCreateAdminAccount(providedKey: string): Promise<boolean> {
  const { serverEnv } = await import("@/lib/env");
  if (!serverEnv.ENABLE_ADMIN_SIGNUP) return false;

  const crypto = await import("crypto");
  const providedBuffer = Buffer.from(providedKey);
  const expectedKeyStr = serverEnv.ADMIN_SIGNUP_KEY ?? "";
  const expectedBuffer = Buffer.from(expectedKeyStr);

  if (providedBuffer.length === expectedBuffer.length && expectedBuffer.length > 0) {
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
  }
  return false;
}

/**
 * Asserts the signup rate limit for a given email.
 * Abstracted to easily swap memory map for Redis/Supabase in the future.
 */
async function assertSignupRateLimit(email: string): Promise<boolean> {
  const { success } = rateLimit(`admin_signup:${email.toLowerCase()}`, 5, 15 * 60_000);
  return success;
}

export async function signUpAdmin(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  // 1. Validate Inputs
  const parsed = signUpAdminSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form data." };
  }

  // 2. Rate Limit Check (max 5 failed attempts per Email)
  const signupOk = await assertSignupRateLimit(parsed.data.email);
  if (!signupOk) {
    return { error: "Too many attempts. Please try again later." };
  }

  // 3. Validate Registration Authorization
  const canCreate = await canCreateAdminAccount(parsed.data.registrationKey);
  if (!canCreate) {
    return { error: "Invalid registration key or admin signup is disabled." };
  }

  // 5. Create Supabase User and 6. Assign ADMIN role
  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { fullName: parsed.data.fullName },
    app_metadata: { role: "ADMIN" },
  });

  if (authError || !authData.user) {
    if (authError?.message?.toLowerCase().includes("already exists")) {
      return { error: "A user with this email already exists." };
    }
    return { error: "Failed to create administrator account." };
  }

  // 7. Create Prisma AppUser
  try {
    const { Role } = await import("@prisma/client");
    await db.appUser.create({
      data: {
        supabaseAuthUserId: authData.user.id,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        role: Role.ADMIN,
        status: "ACTIVE",
        createdBy: "SELF_SIGNUP",
      },
    });
  } catch {
    // If Prisma fails, the Supabase user exists but lacks a profile.
    // In a real app we might try to rollback the Supabase user, but for now we error out.
    return { error: "Failed to create administrator profile." };
  }

  // 8. Create Local Session
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return {
      error:
        "Account created, but failed to log in automatically. Please log in manually.",
    };
  }

  // 9. Redirect to /admin
  redirect("/admin");
}
