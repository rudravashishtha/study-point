/**
 * Creates Supabase Auth test users for CUJ verification.
 * Run: npx tsx scripts/create-test-users.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!;

async function main() {
  const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testUsers = [
    { email: "admin@example.com", password: "TestAdmin@123" },
    { email: "teacher@example.com", password: "TestTeacher@123" },
    { email: "student@example.com", password: "TestStudent@123" },
  ];

  for (const u of testUsers) {
    const { data, error } = await admin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
    });
    if (error) {
      if (error.message?.includes("already exists") || error.message?.includes("already registered")) {
        console.log(`  Already exists: ${u.email}`);
      } else {
        console.error(`  Error creating ${u.email}:`, error.message);
      }
    } else {
      console.log(`  Created: ${u.email} (${data.user.id})`);
    }
  }

  console.log("\nTest users ready. Credentials:");
  console.log("  admin@example.com / TestAdmin@123");
  console.log("  teacher@example.com / TestTeacher@123");
  console.log("  student@example.com / TestStudent@123");
}

main().catch(console.error);
