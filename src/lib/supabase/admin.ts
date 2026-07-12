import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "../env";

if (!publicEnv.NEXT_PUBLIC_SUPABASE_URL || !serverEnv.SUPABASE_SECRET_KEY) {
  throw new Error("Missing Supabase Admin credentials");
}

/**
 * Safely identifies if a Supabase Auth error is specifically due to an existing user conflict.
 * Relies on known @supabase/supabase-js AuthApiError patterns.
 */
export function isExistingSupabaseUserConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const obj = error as Record<string, unknown>;
  const isAuthApiError = obj.name === "AuthApiError";
  const has422Status = obj.status === 422;
  const msg = (typeof obj.message === "string" ? obj.message : "").toLowerCase();

  const isConflictMessage =
    msg.includes("already exists") ||
    msg.includes("already registered") ||
    msg.includes("user_already_exists");

  return (isAuthApiError || has422Status) && isConflictMessage;
}

/**
 * Creates a Supabase client with the service role key.
 * This client bypasses Row Level Security (RLS) and has full admin access.
 * Must ONLY be used on the server, never exposed to the client.
 */
export function createAdminClient() {
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL!,
    serverEnv.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Helper to exactly match a Supabase Auth user by their normalized email.
 * This abstracts any pagination or list iteration required if listUsers doesn't support exact matches,
 * although we first attempt to just paginate and filter.
 * Returns the exact Auth User if found, or null if not found.
 */
export async function findAuthUserByEmail(normalizedEmail: string) {
  const supabase = createAdminClient();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(`Failed to list Supabase users: ${error.message}`);
    }

    if (!data.users || data.users.length === 0) {
      hasMore = false;
      break;
    }

    const match = data.users.find(
      (u) => u.email?.trim().toLowerCase() === normalizedEmail,
    );
    if (match) {
      return match;
    }

    hasMore = data.users.length === 100;
    page++;
  }

  return null;
}
