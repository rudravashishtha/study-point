import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { AppUserStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Retrieves the current trusted Supabase authentication user.
 * Wrapped in react.cache() to deduplicate calls within the same render pass.
 */
export const getAuthUser = cache(async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

/**
 * Retrieves the application user mapped to the current Supabase auth user.
 */
export async function getAppUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const appUser = await db.appUser.findUnique({
    where: { supabaseAuthUserId: authUser.id },
  });

  return appUser;
}

/**
 * Requires an authenticated Supabase user.
 * Throws redirect if not authenticated.
 */
export async function requireAuth() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Requires an active Application user.
 * Throws redirect if not authenticated or not an active AppUser.
 */
export async function requireAppUser() {
  const appUser = await getAppUser();
  if (!appUser) {
    redirect("/login");
  }
  // INVITED users must complete the password-set gate before any portal access.
  // Authorization stays on the database AppUser state, never the JWT claim.
  if (appUser.status === AppUserStatus.INVITED) {
    redirect("/reset-password");
  }
  if (appUser.status !== AppUserStatus.ACTIVE) {
    redirect("/login");
  }
  return appUser;
}

/**
 * Requires the current user to have a specific role.
 */
export async function requireRole(role: Role) {
  const appUser = await requireAppUser();
  if (appUser.role !== role) {
    redirect("/unauthorized");
  }
  return appUser;
}

/**
 * Requires the current user to be an ADMIN.
 */
export async function requireAdmin() {
  return requireRole(Role.ADMIN);
}
