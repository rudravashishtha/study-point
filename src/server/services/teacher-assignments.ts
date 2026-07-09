import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { PermissionCapability, Prisma } from "@prisma/client";
import { extractPrismaConstraintName } from "../../lib/db/errors";

export interface AssignTeacherParams {
  teacherId: string;
  batchId: string;
  permissions: PermissionCapability[];
}

function validatePermissions(permissions: PermissionCapability[]) {
  if (!permissions || permissions.length === 0) {
    return { valid: false, reason: "Permissions cannot be empty" };
  }
  if (!permissions.includes(PermissionCapability.BATCH_VIEW)) {
    return { valid: false, reason: "Permissions must explicitly include BATCH_VIEW" };
  }
  return { valid: true };
}

export async function assignTeacherToBatch(
  actor: ActorContext,
  params: AssignTeacherParams,
) {
  const v = validatePermissions(params.permissions);
  if (!v.valid) {
    return { type: "INVALID_PERMISSIONS" as const, reason: v.reason };
  }

  // Teacher must be non-archived
  const teacher = await db.teacher.findUnique({
    where: { id: params.teacherId },
    select: { active: true },
  });

  if (!teacher || !teacher.active) {
    return { type: "INVALID_LIFECYCLE" as const, reason: "Teacher must be active" };
  }

  // Batch must be non-archived
  const batch = await db.batch.findUnique({
    where: { id: params.batchId },
    select: { archivedAt: true },
  });
  if (!batch || batch.archivedAt !== null) {
    return { type: "INVALID_LIFECYCLE" as const, reason: "Batch must be non-archived" };
  }

  try {
    return await db.$transaction(async (tx) => {
      const assignment = await tx.teacherAssignment.create({
        data: {
          teacherId: params.teacherId,
          batchId: params.batchId,
          permissions: params.permissions,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "TEACHER_ASSIGNMENT",
        entityId: assignment.id,
        summary: `Assigned Teacher to Batch`,
        metadata: {
          teacherId: params.teacherId,
          batchId: params.batchId,
          permissions: params.permissions,
        },
      });

      return { type: "SUCCESS" as const, data: assignment };
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      extractPrismaConstraintName(error) === "TeacherAssignment_teacher_batch_key"
    ) {
      return { type: "DUPLICATE_IDENTITY" as const };
    }
    throw error;
  }
}

export async function updateTeacherAssignmentPermissions(
  actor: ActorContext,
  id: string,
  batchId: string,
  permissions: PermissionCapability[],
) {
  const v = validatePermissions(permissions);
  if (!v.valid) {
    return { type: "INVALID_PERMISSIONS" as const, reason: v.reason };
  }

  return await db.$transaction(async (tx) => {
    const existing = await tx.teacherAssignment.findUnique({
      where: { id },
      select: { archivedAt: true, permissions: true, teacherId: true, batchId: true },
    });

    if (!existing) {
      return { type: "NOT_FOUND" as const };
    }

    if (existing.batchId !== batchId) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Assignment does not belong to the target Batch",
      };
    }

    if (existing.archivedAt !== null) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Cannot update an archived assignment",
      };
    }

    const assignment = await tx.teacherAssignment.update({
      where: { id },
      data: { permissions },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "TEACHER_ASSIGNMENT",
      entityId: assignment.id,
      summary: `Updated permissions for Teacher Assignment`,
      metadata: {
        teacherId: existing.teacherId,
        batchId: existing.batchId,
        previousPermissions: existing.permissions,
        newPermissions: permissions,
      },
    });

    return { type: "SUCCESS" as const, data: assignment };
  });
}

export async function removeTeacherFromBatch(
  actor: ActorContext,
  id: string,
  batchId: string,
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.teacherAssignment.findUnique({
      where: { id },
      select: { archivedAt: true, teacherId: true, batchId: true },
    });

    if (!existing) {
      return { type: "NOT_FOUND" as const };
    }

    if (existing.batchId !== batchId) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Assignment does not belong to the target Batch",
      };
    }

    if (existing.archivedAt !== null) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Assignment is already archived",
      };
    }

    const assignment = await tx.teacherAssignment.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "TEACHER_ASSIGNMENT",
      entityId: assignment.id,
      summary: `Removed Teacher from Batch`,
      metadata: {
        teacherId: existing.teacherId,
        batchId: existing.batchId,
      },
    });

    return { type: "SUCCESS" as const, data: assignment };
  });
}

export async function restoreTeacherAssignment(actor: ActorContext, id: string) {
  const existing = await db.teacherAssignment.findUnique({
    where: { id },
    select: { archivedAt: true, teacherId: true, batchId: true, permissions: true },
  });

  if (!existing) {
    return { type: "NOT_FOUND" as const };
  }

  // Restore active assignment → true no-op
  if (existing.archivedAt === null) {
    return { type: "SUCCESS" as const };
  }

  // Teacher must be non-archived
  const teacher = await db.teacher.findUnique({
    where: { id: existing.teacherId },
    select: { active: true },
  });
  if (!teacher || !teacher.active) {
    return { type: "INVALID_LIFECYCLE" as const, reason: "Teacher must be active" };
  }

  // Batch must be non-archived
  const batch = await db.batch.findUnique({
    where: { id: existing.batchId },
    select: { archivedAt: true },
  });
  if (!batch || batch.archivedAt !== null) {
    return { type: "INVALID_LIFECYCLE" as const, reason: "Batch must be non-archived" };
  }

  try {
    return await db.$transaction(async (tx) => {
      const assignment = await tx.teacherAssignment.update({
        where: { id },
        data: { archivedAt: null },
      });

      await createAuditLog(tx, actor, {
        action: "RESTORE",
        entityType: "TEACHER_ASSIGNMENT",
        entityId: assignment.id,
        summary: `Restored Teacher Assignment`,
        metadata: {
          teacherId: existing.teacherId,
          batchId: existing.batchId,
          permissions: existing.permissions,
        },
      });

      return { type: "SUCCESS" as const, data: assignment };
    });
  } catch (error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      extractPrismaConstraintName(error) === "TeacherAssignment_teacher_batch_key"
    ) {
      return { type: "DUPLICATE_IDENTITY" as const };
    }
    throw error;
  }
}

/**
 * Returns non-archived assignments for the exact Batch by default.
 */
export async function getBatchTeacherAssignments(batchId: string) {
  return await db.teacherAssignment.findMany({
    where: { batchId, archivedAt: null },
    include: {
      teacher: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Returns assignments for the exact Teacher.
 * By default, returns only non-archived (active) assignments.
 */
export async function getTeacherBatchAssignments(
  teacherId: string,
  options?: { includeArchived?: boolean },
) {
  const where: any = { teacherId };
  if (!options?.includeArchived) {
    where.archivedAt = null;
  }

  return await db.teacherAssignment.findMany({
    where,
    include: {
      batch: {
        select: {
          id: true,
          name: true,
          academicSession: true,
          curriculumTrack: { include: { subject: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
