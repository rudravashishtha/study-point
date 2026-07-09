import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { Role, AppUserStatus } from "@prisma/client";
import { db as prisma } from "../src/lib/db";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY environment variables.",
  );
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey);

async function main() {
  const authUserId = process.argv[2];
  const allowOverride = process.argv[3] === "--emergency-additional-admin-override";

  if (!authUserId) {
    console.error(
      "Usage: npx tsx scripts/bootstrap-admin.ts <supabase-auth-user-id> [--emergency-additional-admin-override]",
    );
    process.exit(1);
  }

  try {
    // 1. Verify if an initial admin already exists (unless override is passed)
    if (!allowOverride) {
      const existingAdmin = await prisma.appUser.findFirst({
        where: { role: Role.ADMIN },
      });
      if (existingAdmin) {
        console.error("An ADMIN AppUser already exists. Refusing to bootstrap another.");
        console.error(
          "If this is intentional, use the --emergency-additional-admin-override flag.",
        );
        process.exit(1);
      }
    }

    // 2. Refuse if an AppUser already exists for that auth user
    const existingAppUser = await prisma.appUser.findUnique({
      where: { supabaseAuthUserId: authUserId },
    });
    if (existingAppUser) {
      console.error(`An AppUser already exists for auth user ID: ${authUserId}`);
      process.exit(1);
    }

    // 3. Retrieve trusted identity details from Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.getUserById(authUserId);

    if (error || !user) {
      console.error(
        `Failed to retrieve user from Supabase with ID ${authUserId}:`,
        error?.message || "User not found",
      );
      process.exit(1);
    }

    const email = user.email;

    // 4. Create the ADMIN AppUser
    const newAdmin = await prisma.appUser.create({
      data: {
        supabaseAuthUserId: user.id,
        email: email,
        role: Role.ADMIN,
        status: AppUserStatus.ACTIVE,
        createdBy: "BOOTSTRAP",
      },
    });

    console.log(
      `Successfully created ADMIN AppUser with ID: ${newAdmin.id} for email: ${email}`,
    );
  } catch (err) {
    console.error("Bootstrap failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
