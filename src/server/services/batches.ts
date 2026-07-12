import { Batch, Prisma } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult } from "./types";
import { extractPrismaConstraintName } from "../../lib/db/errors";

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

const batchScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  roomOrLocation: z.string().optional().nullable(),
  liveClassUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const createBatchSchema = z.object({
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  curriculumTrackId: z.string().uuid("Invalid curriculum track ID"),
  name: z.string().min(1, "Batch name is required"),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer")
    .optional()
    .nullable(),
  isPublic: z.boolean().default(false),
  showFeePublicly: z.boolean().default(false),
  isActive: z.boolean().default(true),
  schedules: z.array(batchScheduleSchema).default([]),
});

export type CreateBatchInput = z.input<typeof createBatchSchema>;

export const updateBatchSchema = createBatchSchema
  .extend({
    // Allows partial updates for primitive fields, but schedules are bulk replaced
  })
  .partial()
  .extend({
    schedules: z.array(batchScheduleSchema).optional(),
  });

export type UpdateBatchInput = z.input<typeof updateBatchSchema>;

export const listBatchesSchema = z.object({
  q: z.string().optional(),
  academicSessionId: z.string().uuid().optional(),
  curriculumTrackId: z.string().uuid().optional(),
  archiveState: z.enum(["ACTIVE_ONLY", "ARCHIVED_ONLY", "ALL"]).default("ACTIVE_ONLY"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sort: z.enum(["name", "capacity", "createdAt", "updatedAt"]).default("createdAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
});

export type ListBatchesInput = z.infer<typeof listBatchesSchema>;

export async function listBatches(input: ListBatchesInput) {
  const params = listBatchesSchema.parse(input);
  const {
    q,
    academicSessionId,
    curriculumTrackId,
    archiveState,
    page,
    pageSize,
    sort,
    direction,
  } = params;

  const where: Prisma.BatchWhereInput = {};

  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (academicSessionId) {
    where.academicSessionId = academicSessionId;
  }
  if (curriculumTrackId) {
    where.curriculumTrackId = curriculumTrackId;
  }
  if (archiveState === "ACTIVE_ONLY") {
    where.archivedAt = null;
  } else if (archiveState === "ARCHIVED_ONLY") {
    where.archivedAt = { not: null };
  }

  const [total, items] = await prisma.$transaction([
    prisma.batch.count({ where }),
    prisma.batch.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sort]: direction },
      include: {
        academicSession: true,
        curriculumTrack: {
          include: {
            board: true,
            subject: true,
            programme: true,
          },
        },
        _count: {
          select: {
            enrolments: {
              where: {
                archivedAt: null,
                status: { in: ["active", "suspended"] },
              },
            },
          },
        },
      },
    }),
  ]);

  return { total, page, pageSize, items };
}

export async function getBatchById(id: string) {
  return await prisma.batch.findUnique({
    where: { id },
    include: {
      academicSession: true,
      curriculumTrack: {
        include: {
          board: true,
          subject: true,
          programme: true,
        },
      },
      schedules: true,
      _count: {
        select: {
          enrolments: {
            where: {
              archivedAt: null,
              status: { in: ["active", "suspended"] },
            },
          },
        },
      },
    },
  });
}

/**
 * Validates that A overlaps B
 * A overlaps B when A.startTime < B.endTime and B.startTime < A.endTime
 */
function schedulesOverlap(
  a: z.infer<typeof batchScheduleSchema>,
  b: z.infer<typeof batchScheduleSchema>,
) {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

function validateSchedulesOrThrow(schedules: z.infer<typeof batchScheduleSchema>[]) {
  for (const s of schedules) {
    if (s.startTime >= s.endTime) {
      throw new Error(
        `Schedule start time (${s.startTime}) must be before end time (${s.endTime})`,
      );
    }
  }

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const s1 = schedules[i]!;
      const s2 = schedules[j]!;
      if (s1.dayOfWeek === s2.dayOfWeek && schedulesOverlap(s1, s2)) {
        throw new Error(
          `Overlapping schedules on day ${s1.dayOfWeek}: ${s1.startTime}-${s1.endTime} and ${s2.startTime}-${s2.endTime}`,
        );
      }
    }
  }
}

export async function createBatch(
  input: CreateBatchInput,
): Promise<ServiceResult<Batch>> {
  try {
    const data = createBatchSchema.parse(input);
    validateSchedulesOrThrow(data.schedules);

    // 1. Validate Academic Session
    const session = await prisma.academicSession.findUnique({
      where: { id: data.academicSessionId },
    });
    if (!session || !session.isActive) {
      return {
        success: false,
        error: {
          code: "INVALID_LIFECYCLE",
          message: "Academic session is inactive or missing",
        },
      };
    }

    // 2. Validate Curriculum Track & Parents
    const track = await prisma.curriculumTrack.findUnique({
      where: { id: data.curriculumTrackId },
      include: {
        board: true,
        subject: true,
        programme: true,
      },
    });
    if (!track || track.archivedAt) {
      return {
        success: false,
        error: {
          code: "INVALID_LIFECYCLE",
          message: "Curriculum track is archived or missing",
        },
      };
    }
    if (track.board?.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Board is archived" },
      };
    }
    if (track.subject?.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Subject is archived" },
      };
    }
    if (track.programme && track.programme.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Programme is archived" },
      };
    }

    // 4. Create Batch + Schedules + Audit log
    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({
        data: {
          academicSessionId: data.academicSessionId,
          curriculumTrackId: data.curriculumTrackId,
          name: data.name,
          capacity: data.capacity,
          isPublic: data.isPublic,
          showFeePublicly: data.showFeePublicly,
          isActive: data.isActive,
          schedules: {
            create: data.schedules,
          },
        },
      });

      // Write CREATE audit log containing sanitized initial schedule collection
      await tx.auditLog.create({
        data: {
          entityType: "BATCH",
          entityId: created.id,
          action: "CREATE",
          summary: "Created batch",
          metadata: {
            name: created.name,
            capacity: created.capacity,
            schedules: data.schedules,
          },
        },
      });

      return created;
    });

    return { success: true, data: batch };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Invalid input",
        },
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraint = extractPrismaConstraintName(error);
      if (constraint === "Batch_session_track_name_key") {
        return {
          success: false,
          error: {
            code: "DUPLICATE_IDENTITY",
            message: "A batch with this name already exists in this session and track",
          },
        };
      }
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function updateBatch(
  id: string,
  input: UpdateBatchInput,
): Promise<ServiceResult<Batch>> {
  try {
    const data = updateBatchSchema.parse(input);
    if (data.schedules) {
      validateSchedulesOrThrow(data.schedules);
    }

    const existing = await prisma.batch.findUnique({
      where: { id },
      include: { schedules: true },
    });
    if (!existing) {
      return { success: false, error: { code: "NOT_FOUND", message: "Batch not found" } };
    }
    if (existing.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Cannot update an archived batch" },
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      let scheduleUpdateData = {};
      if (data.schedules) {
        scheduleUpdateData = {
          schedules: {
            deleteMany: {},
            create: data.schedules,
          },
        };
      }

      const { schedules: _, ...primitiveUpdates } = data;
      void _;

      const batch = await tx.batch.update({
        where: { id },
        data: {
          ...primitiveUpdates,
          ...scheduleUpdateData,
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "BATCH",
          entityId: id,
          action: "UPDATE",
          summary: "Updated batch",
          metadata: {
            previousValues: {
              name: existing.name,
              capacity: existing.capacity,
              isActive: existing.isActive,
              schedules: existing.schedules,
            },
            newValues: {
              name: data.name,
              capacity: data.capacity,
              isActive: data.isActive,
              schedules: data.schedules,
            },
          },
        },
      });

      return batch;
    });

    return { success: true, data: updated };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.issues[0]?.message || "Invalid input",
        },
      };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraint = extractPrismaConstraintName(error);
      if (constraint === "Batch_session_track_name_key") {
        return {
          success: false,
          error: {
            code: "DUPLICATE_IDENTITY",
            message: "A batch with this name already exists in this session and track",
          },
        };
      }
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function archiveBatch(id: string): Promise<ServiceResult<Batch>> {
  try {
    const existing = await prisma.batch.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: { code: "NOT_FOUND", message: "Batch not found" } };
    }
    if (existing.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Batch is already archived" },
      };
    }

    // Archiving a Batch will be blocked if any non-archived Enrolment is currently assigned to it.
    const activeEnrolmentsCount = await prisma.enrolment.count({
      where: {
        batchId: id,
        archivedAt: null,
      },
    });

    if (activeEnrolmentsCount > 0) {
      return {
        success: false,
        error: {
          code: "INVALID_LIFECYCLE",
          message: "Cannot archive a batch with active enrolments",
        },
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const archived = await tx.batch.update({
        where: { id },
        data: { archivedAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          entityType: "BATCH",
          entityId: id,
          action: "ARCHIVE",
          summary: "Archived batch",
        },
      });
      return archived;
    });

    return { success: true, data: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function restoreBatch(id: string): Promise<ServiceResult<Batch>> {
  try {
    const existing = await prisma.batch.findUnique({
      where: { id },
    });
    if (!existing) {
      return { success: false, error: { code: "NOT_FOUND", message: "Batch not found" } };
    }
    if (!existing.archivedAt) {
      return { success: true, data: existing }; // true no-op
    }

    const updated = await prisma.$transaction(async (tx) => {
      const restored = await tx.batch.update({
        where: { id },
        data: { archivedAt: null },
      });
      await tx.auditLog.create({
        data: {
          entityType: "BATCH",
          entityId: id,
          action: "RESTORE",
          summary: "Restored batch",
        },
      });
      return restored;
    });

    return { success: true, data: updated };
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraint = extractPrismaConstraintName(error);
      if (constraint === "Batch_session_track_name_key") {
        return {
          success: false,
          error: {
            code: "DUPLICATE_IDENTITY",
            message:
              "Restoring this batch collides with an active batch of the same name",
          },
        };
      }
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}
