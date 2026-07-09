import { db } from "../../lib/db";
import { ActorContext, requireAdminContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import {
  createAdminClient,
  findAuthUserByEmail,
  isExistingSupabaseUserConflict,
} from "../../lib/supabase/admin";
import { publicEnv } from "../../lib/env";

export type StudentActivationCandidate = {
  id: string;
  studentCode: string;
  fullName: string;
  email: string | null;
  isEligible: boolean;
};

export async function listStudentActivationCandidates(
  actor: ActorContext,
): Promise<StudentActivationCandidate[]> {
  requireAdminContext(actor);

  const students = await db.student.findMany({
    where: {
      appUser: null,
      archivedAt: null,
    },
    select: {
      id: true,
      studentCode: true,
      fullName: true,
      email: true,
    },
    orderBy: {
      studentCode: "asc",
    },
  });

  return students.map((s) => ({
    id: s.id,
    studentCode: s.studentCode,
    fullName: s.fullName,
    email: s.email ? s.email.trim().toLowerCase() : null,
    isEligible: !!s.email, // Eligible if it has an email, but appUser is already excluded by query
  }));
}

export async function inviteStudent(actor: ActorContext, studentId: string) {
  // 1. Enforce Admin Authorization
  requireAdminContext(actor);

  const supabase = createAdminClient();

  // 2. Reload the target Student from the database
  const student = await db.student.findUnique({
    where: { id: studentId },
    include: { appUser: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // 3. Reject archived/inactive or otherwise ineligible profiles
  if (student.archivedAt) {
    throw new Error("Cannot provision an archived student");
  }

  // 4. Require an email
  if (!student.email) {
    throw new Error("Student email is required for provisioning");
  }

  // 5. Normalize the email using trim + lowercase
  const normalizedEmail = student.email.trim().toLowerCase();

  // 6. Check whether the profile already has a linked appUser
  if (student.appUser) {
    throw new Error("Student already has a linked appUser");
  }

  // 7. Check whether any appUser already uses the normalized email
  const existingAppUser = await db.appUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingAppUser) {
    throw new Error("Email is already in use by another appUser");
  }

  // 8. Attempt inviteUserByEmail
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { role: "STUDENT" },
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  let supabaseAuthUserId: string;

  if (error) {
    // 9. Reconciliation algorithm
    // If and only if the invitation fails with specific "user already exists" condition
    if (isExistingSupabaseUserConflict(error)) {
      const existingAuthUser = await findAuthUserByEmail(normalizedEmail);
      if (!existingAuthUser) {
        throw new Error(
          "Supabase returned user already exists, but user could not be found",
        );
      }
      supabaseAuthUserId = existingAuthUser.id;
    } else {
      // 10. For every other Supabase error: fail
      throw new Error(`Failed to invite user: ${error.message}`);
    }
  } else {
    if (!data.user) {
      throw new Error("Invite succeeded but no user returned");
    }
    supabaseAuthUserId = data.user.id;
  }

  // 11. Protect Recovered Supabase Auth Identity
  const existingAuthUserLink = await db.appUser.findUnique({
    where: { supabaseAuthUserId },
  });

  if (existingAuthUserLink) {
    throw new Error("Supabase Auth Identity is already linked to another appUser");
  }

  // 12. Continue to database persistence
  return await db.$transaction(async (tx) => {
    const appUser = await tx.appUser.create({
      data: {
        supabaseAuthUserId,
        email: normalizedEmail,
        role: "STUDENT",
        status: "INVITED",
        studentId: student.id,
      },
    });

    await tx.student.update({
      where: { id: student.id },
      data: { accountStatus: "invited" },
    });

    await createAuditLog(tx, actor, {
      action: "PROVISION",
      entityType: "STUDENT",
      entityId: student.id,
      metadata: { role: "STUDENT", status: "INVITED" },
      summary: `Invited student ${normalizedEmail}`,
    });

    return appUser;
  });
}

export async function inviteTeacher(actor: ActorContext, teacherId: string) {
  // 1. Enforce Admin Authorization
  requireAdminContext(actor);

  const supabase = createAdminClient();

  // 2. Reload the target Teacher from the database
  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
    include: { appUser: true },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  // 3. Reject archived/inactive or otherwise ineligible profiles
  if (!teacher.active) {
    throw new Error("Cannot provision an inactive teacher");
  }

  // 4. Require an email
  if (!teacher.email) {
    throw new Error("Teacher email is required for provisioning");
  }

  // 5. Normalize the email using trim + lowercase
  const normalizedEmail = teacher.email.trim().toLowerCase();

  // 6. Check whether the profile already has a linked appUser
  if (teacher.appUser) {
    throw new Error("Teacher already has a linked appUser");
  }

  // 7. Check whether any appUser already uses the normalized email
  const existingAppUser = await db.appUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingAppUser) {
    throw new Error("Email is already in use by another AppUser");
  }

  // 8. Attempt inviteUserByEmail
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
    data: { role: "TEACHER" },
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
  });

  let supabaseAuthUserId: string;

  if (error) {
    // 9. Reconciliation algorithm
    if (isExistingSupabaseUserConflict(error)) {
      const existingAuthUser = await findAuthUserByEmail(normalizedEmail);
      if (!existingAuthUser) {
        throw new Error(
          "Supabase returned user already exists, but user could not be found",
        );
      }
      supabaseAuthUserId = existingAuthUser.id;
    } else {
      // 10. For every other Supabase error: fail
      throw new Error(`Failed to invite user: ${error.message}`);
    }
  } else {
    if (!data.user) {
      throw new Error("Invite succeeded but no user returned");
    }
    supabaseAuthUserId = data.user.id;
  }

  // 11. Protect Recovered Supabase Auth Identity
  const existingAuthUserLink = await db.appUser.findUnique({
    where: { supabaseAuthUserId },
  });

  if (existingAuthUserLink) {
    throw new Error("Supabase Auth Identity is already linked to another AppUser");
  }

  // 12. Continue to database persistence
  return await db.$transaction(async (tx) => {
    const appUser = await tx.appUser.create({
      data: {
        supabaseAuthUserId,
        email: normalizedEmail,
        role: "TEACHER",
        status: "INVITED",
        teacherId: teacher.id,
      },
    });

    await createAuditLog(tx, actor, {
      action: "PROVISION",
      entityType: "TEACHER",
      entityId: teacher.id,
      metadata: { role: "TEACHER", status: "INVITED" },
      summary: `Invited teacher ${normalizedEmail}`,
    });

    return appUser;
  });
}
