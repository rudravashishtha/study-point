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
