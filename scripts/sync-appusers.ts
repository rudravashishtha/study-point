/**
 * Syncs AppUser records to match actual Supabase Auth user IDs.
 * Run: npx tsx scripts/sync-appusers.ts
 */
import "dotenv/config";
import { db } from "../src/lib/db";
import { Role, AppUserStatus } from "@prisma/client";

async function main() {
  // The actual Supabase Auth IDs created by create-test-users.ts
  const authUsers = {
    admin: "5f07feb7-2387-4d05-84fa-87c21abd9425",
    teacher: "28f5d5a5-b867-4b7f-b155-97ba756218a0",
    student: "8664aa51-ba1e-48bd-8c09-19e1a71eaf14",
  };

  // 1. Fix admin: update supabaseAuthUserId to the real one
  const admin = await db.appUser.findFirst({ where: { email: "admin@example.com" } });
  if (admin) {
    await db.appUser.update({
      where: { id: admin.id },
      data: { supabaseAuthUserId: authUsers.admin, status: AppUserStatus.ACTIVE },
    });
    console.log(`Admin AppUser synced: ${admin.id} → ${authUsers.admin}`);
  } else {
    console.error("Admin AppUser not found! Run seed first.");
    return;
  }

  // 2. Verify teacher exists in Teacher table, create AppUser
  const teacherProfile = await db.teacher.findFirst({ where: { email: "teacher@example.com" } });
  if (!teacherProfile) {
    console.error("Teacher profile not found! Run seed first.");
    return;
  }
  const teacherAppUser = await db.appUser.findFirst({ where: { email: "teacher@example.com" } });
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
    console.log(`Teacher AppUser created → ${authUsers.teacher}`);
  } else {
    await db.appUser.update({
      where: { id: teacherAppUser.id },
      data: { supabaseAuthUserId: authUsers.teacher, teacherId: teacherProfile.id, status: AppUserStatus.ACTIVE },
    });
    console.log(`Teacher AppUser synced → ${authUsers.teacher}`);
  }

  // 3. Verify student exists, create AppUser
  const studentProfile = await db.student.findFirst();
  if (!studentProfile) {
    console.error("Student not found! Run seed first.");
    return;
  }
  const studentAppUser = await db.appUser.findFirst({ where: { email: "student@example.com" } });
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
    console.log(`Student AppUser created → ${authUsers.student}`);
  } else {
    await db.appUser.update({
      where: { id: studentAppUser.id },
      data: { supabaseAuthUserId: authUsers.student, studentId: studentProfile.id, status: AppUserStatus.ACTIVE },
    });
    console.log(`Student AppUser synced → ${authUsers.student}`);
  }

  console.log("\nAll AppUser records synced. CUJ verification ready.");
  console.log("Credentials:");
  console.log("  admin@example.com    / TestAdmin@123  → /admin");
  console.log("  teacher@example.com  / TestTeacher@123 → /teacher");
  console.log("  student@example.com  / TestStudent@123 → /student");
}

main().catch(console.error);
