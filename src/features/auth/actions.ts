"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUser } from "@/lib/auth/permissions";
import { roleHome } from "@/lib/auth/route-guards";

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
