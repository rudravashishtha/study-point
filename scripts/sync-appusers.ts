/**
 * Syncs AppUser records to match actual Supabase Auth user IDs.
 * Run: npx tsx scripts/sync-appusers.ts
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { Role, AppUserStatus } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

async function main() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );

  // Fetch all users to map their emails to their actual IDs
  const {
    data: { users },
    error,
  } = await supabaseAdmin.auth.admin.listUsers();
  if (error || !users) {
    console.error("Failed to fetch users from Supabase:", error);
    return;
  }

  const authUsers = {
    admin: users.find((u) => u.email === "admin@example.com")?.id as string,
    teacher: users.find((u) => u.email === "teacher@example.com")?.id as string,
    student: users.find((u) => u.email === "student@example.com")?.id as string,
  };

  if (!authUsers.admin || !authUsers.teacher || !authUsers.student) {
    console.error(
      "Missing one or more test users in Supabase. Run scripts/create-test-users.ts first.",
    );
    return;
  }

  // 1. Fix admin: update supabaseAuthUserId to the real one
  const admin = await db.appUser.findFirst({ where: { email: "admin@example.com" } });
  if (admin) {
    await db.appUser.update({
      where: { id: admin.id },
      data: { supabaseAuthUserId: authUsers.admin, status: AppUserStatus.ACTIVE },
    });
    await supabaseAdmin.auth.admin.updateUserById(authUsers.admin, {
      app_metadata: { role: Role.ADMIN },
    });
    console.log(`Admin AppUser synced: ${admin.id} → ${authUsers.admin} (Role: ADMIN)`);
  } else {
    console.error("Admin AppUser not found! Run seed first.");
    return;
  }

  // 2. Verify teacher exists in Teacher table, create AppUser
  const teacherProfile = await db.teacher.findFirst({
    where: { email: "teacher@example.com" },
  });
  if (!teacherProfile) {
    console.error("Teacher profile not found! Run seed first.");
    return;
  }
  const teacherAppUser = await db.appUser.findFirst({
    where: { email: "teacher@example.com" },
  });
  if (!teacherAppUser) {
    await db.appUser.create({
      data: {
        supabaseAuthUserId: authUsers.teacher,
        email: "teacher@example.com",
        role: Role.TEACHER,
        status: AppUserStatus.ACTIVE,
        teacherId: teacherProfile.id,
        createdBy: admin?.id ?? "SEED",
      },
    });
    await supabaseAdmin.auth.admin.updateUserById(authUsers.teacher, {
      app_metadata: { role: Role.TEACHER },
    });
    console.log(`Teacher AppUser created → ${authUsers.teacher} (Role: TEACHER)`);
  } else {
    await db.appUser.update({
      where: { id: teacherAppUser.id },
      data: {
        supabaseAuthUserId: authUsers.teacher,
        teacherId: teacherProfile.id,
        status: AppUserStatus.ACTIVE,
      },
    });
    await supabaseAdmin.auth.admin.updateUserById(authUsers.teacher, {
      app_metadata: { role: Role.TEACHER },
    });
    console.log(`Teacher AppUser synced → ${authUsers.teacher} (Role: TEACHER)`);
  }

  // 3. Verify student exists, create AppUser
  const studentProfile = await db.student.findFirst();
  if (!studentProfile) {
    console.error("Student not found! Run seed first.");
    return;
  }
  const studentAppUser = await db.appUser.findFirst({
    where: { email: "student@example.com" },
  });
  if (!studentAppUser) {
    await db.appUser.create({
      data: {
        supabaseAuthUserId: authUsers.student,
        email: "student@example.com",
        role: Role.STUDENT,
        status: AppUserStatus.ACTIVE,
        studentId: studentProfile.id,
        createdBy: admin?.id ?? "SEED",
      },
    });
    await supabaseAdmin.auth.admin.updateUserById(authUsers.student, {
      app_metadata: { role: Role.STUDENT },
    });
    console.log(`Student AppUser created → ${authUsers.student} (Role: STUDENT)`);
  } else {
    await db.appUser.update({
      where: { id: studentAppUser.id },
      data: {
        supabaseAuthUserId: authUsers.student,
        studentId: studentProfile.id,
        status: AppUserStatus.ACTIVE,
      },
    });
    await supabaseAdmin.auth.admin.updateUserById(authUsers.student, {
      app_metadata: { role: Role.STUDENT },
    });
    console.log(`Student AppUser synced → ${authUsers.student} (Role: STUDENT)`);
  }

  console.log("\nAll AppUser records synced. CUJ verification ready.");
  console.log("Credentials:");
  console.log("  admin@example.com    / TestAdmin@123  → /admin");
  console.log("  teacher@example.com  / TestTeacher@123 → /teacher");
  console.log("  student@example.com  / TestStudent@123 → /student");
}

main().catch(console.error);
