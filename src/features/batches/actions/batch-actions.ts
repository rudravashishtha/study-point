"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { updateBatch, getBatchById } from "@/server/services/batches";
import {
  getStudentEnrolmentStatus,
  createEnrolment,
  updateEnrolment,
} from "@/server/services/enrolments";
import { failure, success } from "@/server/services/types";
import { db } from "@/lib/db";

export async function listActiveStudentsAction(query?: string) {
  await requireAdmin();
  const students = await db.student.findMany({
    where: {
      archivedAt: null,
      ...(query
        ? {
            OR: [
              { fullName: { contains: query, mode: "insensitive" } },
              { studentCode: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, studentCode: true, fullName: true },
    orderBy: { fullName: "asc" },
    take: 50,
  });
  return success(students);
}

export async function lookupStudentByCodeAction(studentCode: string) {
  await requireAdmin();
  const student = await db.student.findUnique({
    where: { studentCode },
    select: { id: true, studentCode: true, fullName: true, archivedAt: true },
  });
  if (!student) return failure("NOT_FOUND", "Student not found");
  if (student.archivedAt) return failure("INVALID_STATE", "Student is archived");
  return success(student);
}

export async function updateBatchSchedulesAction(
  batchId: string,
  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    roomOrLocation?: string | null;
    liveClassUrl?: string | null;
    isActive: boolean;
  }[],
) {
  await requireAdmin();

  const result = await updateBatch(batchId, { schedules });

  if (result.success) {
    revalidatePath(`/admin/batches/${batchId}`);
  }
  return result;
}

export async function resolveStudentBatchMembershipAction(
  batchId: string,
  studentId: string,
) {
  await requireAdmin();

  const batch = await getBatchById(batchId);
  if (!batch) {
    return failure("NOT_FOUND", "Batch not found");
  }

  const result = await getStudentEnrolmentStatus(
    studentId,
    batch.academicSessionId,
    batch.curriculumTrackId,
    batchId,
  );

  return success(result);
}

export async function createEnrolmentForBatchAction(batchId: string, studentId: string) {
  await requireAdmin();

  const batch = await getBatchById(batchId);
  if (!batch) return failure("NOT_FOUND", "Batch not found");
  if (!batch.isActive)
    return failure("INVALID_STATE", "Cannot enrol into inactive batch");
  if (batch.archivedAt)
    return failure("INVALID_STATE", "Cannot enrol into archived batch");

  // Server-side authoritative data
  const result = await createEnrolment({
    studentId,
    academicSessionId: batch.academicSessionId,
    curriculumTrackId: batch.curriculumTrackId,
    batchId: batch.id,
    joiningDate: new Date(),
    status: "active",
  });

  if (result.success) {
    revalidatePath(`/admin/batches/${batchId}`);
  }
  return result;
}

export async function assignEnrolmentToBatchAction(batchId: string, enrolmentId: string) {
  await requireAdmin();

  const batch = await getBatchById(batchId);
  if (!batch) return failure("NOT_FOUND", "Batch not found");
  if (!batch.isActive) return failure("INVALID_STATE", "Cannot assign to inactive batch");
  if (batch.archivedAt)
    return failure("INVALID_STATE", "Cannot assign to archived batch");

  const result = await updateEnrolment(enrolmentId, {
    batchId: batch.id,
  });

  if (result.success) {
    revalidatePath(`/admin/batches/${batchId}`);
  }
  return result;
}

export async function removeEnrolmentFromBatchAction(
  batchId: string,
  enrolmentId: string,
) {
  await requireAdmin();

  // Technically we don't strictly *need* to load the batch to remove, but we should verify it.
  const batch = await getBatchById(batchId);
  if (!batch) return failure("NOT_FOUND", "Batch not found");
  if (!batch.isActive)
    return failure("INVALID_STATE", "Cannot alter inactive batch membership");
  if (batch.archivedAt)
    return failure("INVALID_STATE", "Cannot alter archived batch membership");

  const result = await updateEnrolment(enrolmentId, {
    batchId: null, // this makes it UNASSIGNED
  });

  if (result.success) {
    revalidatePath(`/admin/batches/${batchId}`);
  }
  return result;
}

import {
  assignTeacherToBatch,
  updateTeacherAssignmentPermissions,
  removeTeacherFromBatch,
} from "@/server/services/teacher-assignments";
import { PermissionCapability } from "@prisma/client";

export async function assignTeacherAction(
  batchId: string,
  teacherId: string,
  permissions: PermissionCapability[],
) {
  const appUser = await requireAdmin();
  const actor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: { role: appUser.role, status: "ACTIVE" },
  };

  const result = await assignTeacherToBatch(actor, {
    teacherId,
    batchId,
    permissions,
  });

  if (result.type === "SUCCESS") {
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  }
  return { error: result.reason || "Failed to assign teacher" };
}

export async function updateTeacherPermissionsAction(
  batchId: string,
  assignmentId: string,
  permissions: PermissionCapability[],
) {
  const appUser = await requireAdmin();
  const actor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: { role: appUser.role, status: "ACTIVE" },
  };

  const result = await updateTeacherAssignmentPermissions(
    actor,
    assignmentId,
    batchId,
    permissions,
  );

  if (result.type === "SUCCESS") {
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  }
  return { error: result.reason || "Failed to update permissions" };
}

export async function removeTeacherAssignmentAction(
  batchId: string,
  assignmentId: string,
) {
  const appUser = await requireAdmin();
  const actor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: { role: appUser.role, status: "ACTIVE" },
  };

  const result = await removeTeacherFromBatch(actor, assignmentId, batchId);

  if (result.type === "SUCCESS") {
    revalidatePath(`/admin/batches/${batchId}`);
    return { success: true };
  }
  return { error: result.reason || "Failed to remove assignment" };
}
