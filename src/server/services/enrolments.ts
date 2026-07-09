import { Prisma, Enrolment } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult } from "./types";
import { extractPrismaConstraintName, isConcurrencyConflict } from "../../lib/db/errors";

const validStatuses = ["active", "suspended", "withdrawn", "completed"] as const;

export const enrolmentCreateSchema = z.object({
  studentId: z.string().uuid(),
  academicSessionId: z.string().uuid(),
  curriculumTrackId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  joiningDate: z.date(),
  status: z.enum(validStatuses).optional().default("active"),
});

export const enrolmentUpdateSchema = z.object({
  batchId: z.string().uuid().optional().nullable(),
  status: z.enum(validStatuses).optional(),
});

export type EnrolmentCreateData = z.input<typeof enrolmentCreateSchema>;
export type EnrolmentUpdateData = z.input<typeof enrolmentUpdateSchema>;

export async function getBatchEnrolments(batchId: string) {
  return await prisma.enrolment.findMany({
    where: {
      batchId,
      archivedAt: null,
    },
    include: {
      student: true,
    },
    orderBy: {
      student: {
        fullName: "asc",
      },
    },
  });
}

export type StudentEnrolmentState =
  | { state: "UNENROLLED" }
  | { state: "UNASSIGNED"; enrolmentId: string }
  | { state: "ALREADY_IN_BATCH"; enrolmentId: string }
  | { state: "ASSIGNED_ELSEWHERE"; enrolmentId: string; batchName: string };

export async function getStudentEnrolmentStatus(
  studentId: string,
  academicSessionId: string,
  curriculumTrackId: string,
  currentBatchId: string,
): Promise<StudentEnrolmentState> {
  const enrolment = await prisma.enrolment.findFirst({
    where: {
      studentId,
      academicSessionId,
      curriculumTrackId,
      archivedAt: null,
    },
    include: {
      batch: true,
    },
  });

  if (!enrolment) {
    return { state: "UNENROLLED" };
  }

  if (!enrolment.batchId) {
    return { state: "UNASSIGNED", enrolmentId: enrolment.id };
  }

  if (enrolment.batchId === currentBatchId) {
    return { state: "ALREADY_IN_BATCH", enrolmentId: enrolment.id };
  }

  return {
    state: "ASSIGNED_ELSEWHERE",
    enrolmentId: enrolment.id,
    batchName: enrolment.batch?.name ?? "Unknown Batch",
  };
}

export async function createEnrolment(
  data: EnrolmentCreateData,
): Promise<ServiceResult<Enrolment>> {
  try {
    const parsed = enrolmentCreateSchema.parse(data);

    // If batch provided, ensure session and track match batch
    if (parsed.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: parsed.batchId },
        select: { academicSessionId: true, curriculumTrackId: true },
      });
      if (!batch)
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Batch not found" },
        };
      if (
        batch.academicSessionId !== parsed.academicSessionId ||
        batch.curriculumTrackId !== parsed.curriculumTrackId
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Batch session and track must match enrolment",
          },
        };
      }
    }

    const created = await prisma.$transaction(
      async (tx) => {
        if (
          parsed.batchId &&
          (parsed.status === "active" || parsed.status === "suspended")
        ) {
          const batch = await tx.batch.findUnique({
            where: { id: parsed.batchId },
            select: { capacity: true },
          });
          if (batch?.capacity) {
            const currentCount = await tx.enrolment.count({
              where: {
                batchId: parsed.batchId,
                archivedAt: null,
                status: { in: ["active", "suspended"] },
              },
            });
            if (currentCount >= batch.capacity) {
              throw new Error("CAPACITY_EXCEEDED");
            }
          }
        }

        const enrolment = await tx.enrolment.create({
          data: {
            ...parsed,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "ENROLMENT",
            entityId: enrolment.id,
            action: "CREATE",
            summary: "Created enrolment",
            metadata: {
              studentId: enrolment.studentId,
              academicSessionId: enrolment.academicSessionId,
              curriculumTrackId: enrolment.curriculumTrackId,
              batchId: enrolment.batchId,
              status: enrolment.status,
            },
          },
        });
        return enrolment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { success: true, data: created };
  } catch (error: any) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return {
        success: false,
        error: { code: "CAPACITY_EXCEEDED", message: "Batch capacity exceeded" },
      };
    }
    const constraintName = extractPrismaConstraintName(error);
    if (constraintName === "Enrolment_student_session_track_key") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_IDENTITY",
          message: "Student is already enrolled in this track for this session",
        },
      };
    }
    if (isConcurrencyConflict(error)) {
      return {
        success: false,
        error: {
          code: "CONCURRENCY_ERROR",
          message: "Transaction failed due to a concurrent update. Please try again.",
        },
      };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Validation error",
        },
      };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function updateEnrolment(
  id: string,
  data: EnrolmentUpdateData,
): Promise<ServiceResult<Enrolment>> {
  try {
    const parsed = enrolmentUpdateSchema.parse(data);

    const existing = await prisma.enrolment.findUnique({ where: { id } });
    if (!existing)
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Enrolment not found" },
      };
    if (existing.archivedAt)
      return {
        success: false,
        error: {
          code: "INVALID_LIFECYCLE",
          message: "Cannot update an archived enrolment",
        },
      };

    const targetBatchId =
      parsed.batchId !== undefined ? parsed.batchId : existing.batchId;
    const targetStatus = parsed.status ?? existing.status;

    if (targetBatchId && targetBatchId !== existing.batchId) {
      const batch = await prisma.batch.findUnique({
        where: { id: targetBatchId },
        select: { academicSessionId: true, curriculumTrackId: true },
      });
      if (!batch)
        return {
          success: false,
          error: { code: "NOT_FOUND", message: "Batch not found" },
        };
      if (
        batch.academicSessionId !== existing.academicSessionId ||
        batch.curriculumTrackId !== existing.curriculumTrackId
      ) {
        return {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Batch session and track must match enrolment",
          },
        };
      }
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // Enforce capacity if batch changes or status changes to active/suspended
        const willConsumeCapacity =
          !!targetBatchId && (targetStatus === "active" || targetStatus === "suspended");
        const wasConsumingCapacity =
          !!existing.batchId &&
          (existing.status === "active" || existing.status === "suspended");

        if (
          willConsumeCapacity &&
          (!wasConsumingCapacity || targetBatchId !== existing.batchId)
        ) {
          const batch = await tx.batch.findUnique({
            where: { id: targetBatchId },
            select: { capacity: true },
          });
          if (batch?.capacity) {
            const currentCount = await tx.enrolment.count({
              where: {
                batchId: targetBatchId,
                archivedAt: null,
                status: { in: ["active", "suspended"] },
              },
            });
            if (currentCount >= batch.capacity) {
              throw new Error("CAPACITY_EXCEEDED");
            }
          }
        }

        const updatedEnrolment = await tx.enrolment.update({
          where: { id },
          data: {
            ...parsed,
          },
        });

        await tx.auditLog.create({
          data: {
            entityType: "ENROLMENT",
            entityId: id,
            action: "UPDATE",
            summary: "Updated enrolment",
            metadata: {
              previousValues: {
                batchId: existing.batchId,
                status: existing.status,
              },
              newValues: {
                batchId: targetBatchId,
                status: targetStatus,
              },
            },
          },
        });
        return updatedEnrolment;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { success: true, data: updated };
  } catch (error: any) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return {
        success: false,
        error: { code: "CAPACITY_EXCEEDED", message: "Batch capacity exceeded" },
      };
    }
    if (isConcurrencyConflict(error)) {
      return {
        success: false,
        error: {
          code: "CONCURRENCY_ERROR",
          message: "Transaction failed due to a concurrent update. Please try again.",
        },
      };
    }
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Validation error",
        },
      };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function archiveEnrolment(id: string): Promise<ServiceResult<Enrolment>> {
  try {
    const existing = await prisma.enrolment.findUnique({ where: { id } });
    if (!existing)
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Enrolment not found" },
      };
    if (existing.archivedAt)
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Enrolment is already archived" },
      };

    const archived = await prisma.$transaction(async (tx) => {
      const updated = await tx.enrolment.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          entityType: "ENROLMENT",
          entityId: id,
          action: "ARCHIVE",
          summary: "Archived enrolment",
        },
      });
      return updated;
    });
    return { success: true, data: archived };
  } catch (error: any) {
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}

export async function restoreEnrolment(id: string): Promise<ServiceResult<Enrolment>> {
  try {
    const existing = await prisma.enrolment.findUnique({ where: { id } });
    if (!existing)
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Enrolment not found" },
      };
    if (!existing.archivedAt) return { success: true, data: existing };

    const restored = await prisma.$transaction(
      async (tx) => {
        // Enforce capacity and identity constraints during restore
        const consumesCapacity =
          !!existing.batchId &&
          (existing.status === "active" || existing.status === "suspended");
        if (consumesCapacity) {
          const batch = await tx.batch.findUnique({
            where: { id: existing.batchId! },
            select: { capacity: true },
          });
          if (batch?.capacity) {
            const currentCount = await tx.enrolment.count({
              where: {
                batchId: existing.batchId,
                archivedAt: null,
                status: { in: ["active", "suspended"] },
              },
            });
            if (currentCount >= batch.capacity) {
              throw new Error("CAPACITY_EXCEEDED");
            }
          }
        }

        const updated = await tx.enrolment.update({
          where: { id },
          data: { archivedAt: null },
        });

        await tx.auditLog.create({
          data: {
            entityType: "ENROLMENT",
            entityId: id,
            action: "RESTORE",
            summary: "Restored enrolment",
          },
        });
        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return { success: true, data: restored };
  } catch (error: any) {
    if (error.message === "CAPACITY_EXCEEDED") {
      return {
        success: false,
        error: { code: "CAPACITY_EXCEEDED", message: "Batch capacity exceeded" },
      };
    }
    const constraintName = extractPrismaConstraintName(error);
    if (constraintName === "Enrolment_student_session_track_key") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_IDENTITY",
          message: "Student is already enrolled in this track for this session",
        },
      };
    }
    if (isConcurrencyConflict(error)) {
      return {
        success: false,
        error: {
          code: "CONCURRENCY_ERROR",
          message: "Transaction failed due to a concurrent update. Please try again.",
        },
      };
    }
    return { success: false, error: { code: "INTERNAL_ERROR", message: error.message } };
  }
}
export async function assignToBatch(
  id: string,
  batchId: string,
): Promise<ServiceResult<Enrolment>> {
  return updateEnrolment(id, { batchId });
}

export async function removeFromBatch(id: string): Promise<ServiceResult<Enrolment>> {
  const existing = await prisma.enrolment.findUnique({ where: { id } });
  if (!existing)
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Enrolment not found" },
    };
  if (existing.archivedAt)
    return {
      success: false,
      error: {
        code: "INVALID_LIFECYCLE",
        message: "Cannot modify an archived enrolment",
      },
    };
  if (existing.batchId === null) return { success: true, data: existing };
  return updateEnrolment(id, { batchId: null });
}
