import { LiveClassSession, Prisma, Role } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult } from "./types";

import {
  liveClassSessionSchema,
  CreateLiveClassSessionInput,
  UpdateLiveClassSessionInput,
  LiveClassSessionDTO,
  Actor,
} from "@/lib/validation/live-classes";

async function checkTeacherAssignment(
  batchId: string,
  teacherId: string,
): Promise<boolean> {
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      batchId,
      teacherId,
      archivedAt: null,
      permissions: { has: "SCHEDULE_MANAGE" },
    },
  });
  return !!assignment;
}

export async function createLiveClassSession(
  input: CreateLiveClassSessionInput,
  actor: Actor,
): Promise<ServiceResult<LiveClassSession>> {
  try {
    const data = liveClassSessionSchema.parse(input);

    if (data.scheduledEndTime <= data.scheduledStartTime) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "End time must be after start time" },
      };
    }

    if (actor.role !== Role.ADMIN) {
      if (
        actor.role !== Role.TEACHER ||
        !actor.teacherId ||
        actor.teacherId !== data.teacherId
      ) {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Unauthorized to assign this teacher" },
        };
      }
    }

    // Ensure the teacher is actually assigned to the batch
    const hasAccess = await checkTeacherAssignment(data.batchId, data.teacherId);
    if (!hasAccess) {
      return {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Teacher is not assigned to this batch with schedule permissions",
        },
      };
    }

    const batch = await prisma.batch.findUnique({
      where: { id: data.batchId },
    });

    if (!batch || !batch.isActive || batch.archivedAt) {
      return {
        success: false,
        error: { code: "INVALID_LIFECYCLE", message: "Batch is inactive or archived" },
      };
    }

    const session = await prisma.liveClassSession.create({
      data: {
        batchId: data.batchId,
        teacherId: data.teacherId,
        title: data.title,
        scheduledStartTime: data.scheduledStartTime,
        scheduledEndTime: data.scheduledEndTime,
        meetingUrl: data.meetingUrl,
        status: data.status,
        createdBy: actor.id,
      },
    });

    return { success: true, data: session };
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function updateLiveClassSession(
  id: string,
  input: Partial<UpdateLiveClassSessionInput>,
  actor: Actor,
): Promise<ServiceResult<LiveClassSession>> {
  try {
    const existing = await prisma.liveClassSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Session not found" },
      };
    }

    if (actor.role !== Role.ADMIN) {
      if (input.batchId && input.batchId !== existing.batchId) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Teachers cannot change the batch of a session",
          },
        };
      }
      if (input.teacherId && input.teacherId !== existing.teacherId) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Teachers cannot reassign the session to another teacher",
          },
        };
      }
      if (
        actor.role !== Role.TEACHER ||
        !actor.teacherId ||
        actor.teacherId !== existing.teacherId
      ) {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Unauthorized to modify this session" },
        };
      }
      const hasAccess = await checkTeacherAssignment(
        existing.batchId,
        existing.teacherId,
      );
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Unauthorized to manage schedule for this batch",
          },
        };
      }
    }

    if (
      existing.status === "CANCELLED" &&
      input.status !== "SCHEDULED" &&
      input.status !== "COMPLETED"
    ) {
      const allowedKeys = ["status"];
      const keys = Object.keys(input);
      if (keys.some((k) => !allowedKeys.includes(k))) {
        return {
          success: false,
          error: {
            code: "INVALID_LIFECYCLE",
            message: "Cannot edit a cancelled session",
          },
        };
      }
    }

    const newStartTime = input.scheduledStartTime
      ? new Date(input.scheduledStartTime)
      : existing.scheduledStartTime;
    const newEndTime = input.scheduledEndTime
      ? new Date(input.scheduledEndTime)
      : existing.scheduledEndTime;

    if (newEndTime <= newStartTime) {
      return {
        success: false,
        error: { code: "VALIDATION_ERROR", message: "End time must be after start time" },
      };
    }

    const session = await prisma.liveClassSession.update({
      where: { id },
      data: {
        ...input,
        updatedBy: actor.id,
      },
    });

    return { success: true, data: session };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function cancelLiveClassSession(
  id: string,
  actor: Actor,
): Promise<ServiceResult<LiveClassSession>> {
  try {
    const existing = await prisma.liveClassSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Session not found" },
      };
    }

    if (actor.role !== Role.ADMIN) {
      if (
        actor.role !== Role.TEACHER ||
        !actor.teacherId ||
        actor.teacherId !== existing.teacherId
      ) {
        return {
          success: false,
          error: { code: "FORBIDDEN", message: "Unauthorized to modify this session" },
        };
      }
      const hasAccess = await checkTeacherAssignment(
        existing.batchId,
        existing.teacherId,
      );
      if (!hasAccess) {
        return {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Unauthorized to manage schedule for this batch",
          },
        };
      }
    }

    const session = await prisma.liveClassSession.update({
      where: { id },
      data: {
        status: "CANCELLED",
        updatedBy: actor.id,
      },
    });

    return { success: true, data: session };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { code: "INTERNAL_ERROR", message } };
  }
}

export async function getLiveClassSessionsForAdmin(options?: {
  batchId?: string;
}): Promise<LiveClassSessionDTO[]> {
  const where: Prisma.LiveClassSessionWhereInput = {};
  if (options?.batchId) {
    where.batchId = options.batchId;
  }
  return await prisma.liveClassSession.findMany({
    where,
    orderBy: { scheduledStartTime: "asc" },
    include: {
      batch: { select: { id: true, name: true } },
      teacher: { select: { id: true, displayName: true } },
    },
  });
}

export async function getLiveClassSessionsForTeacher(
  teacherId: string,
  options?: { batchId?: string },
): Promise<LiveClassSessionDTO[]> {
  const where: Prisma.LiveClassSessionWhereInput = { teacherId };
  if (options?.batchId) {
    const hasAccess = await checkTeacherAssignment(options.batchId, teacherId);
    if (!hasAccess) return [];
    where.batchId = options.batchId;
  } else {
    // Determine which batches the teacher is assigned to, so we don't return classes for batches they no longer teach
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId, archivedAt: null, permissions: { has: "SCHEDULE_MANAGE" } },
      select: { batchId: true },
    });
    const batchIds = assignments.map((a) => a.batchId);
    if (batchIds.length === 0) return [];
    where.batchId = { in: batchIds };
  }

  return await prisma.liveClassSession.findMany({
    where,
    orderBy: { scheduledStartTime: "asc" },
    include: {
      batch: { select: { id: true, name: true } },
      teacher: { select: { id: true, displayName: true } },
    },
  });
}

export async function getLiveClassSessionsForStudent(
  studentId: string,
  options?: { from?: Date; to?: Date },
): Promise<LiveClassSessionDTO[]> {
  const enrolments = await prisma.enrolment.findMany({
    where: {
      studentId,
      archivedAt: null,
      status: { in: ["active"] },
    },
    select: { batchId: true },
  });

  const batchIds = enrolments.map((e) => e.batchId).filter(Boolean) as string[];

  if (batchIds.length === 0) return [];

  const where: Prisma.LiveClassSessionWhereInput = {
    batchId: { in: batchIds },
    status: { in: ["SCHEDULED", "COMPLETED"] }, // Student should not see cancelled sessions as joinable
  };

  if (options?.from || options?.to) {
    where.scheduledStartTime = {};
    if (options.from) where.scheduledStartTime.gte = options.from;
    if (options.to) where.scheduledStartTime.lte = options.to;
  }

  return await prisma.liveClassSession.findMany({
    where,
    orderBy: { scheduledStartTime: "asc" },
    include: {
      batch: { select: { id: true, name: true } },
      teacher: { select: { id: true, displayName: true } },
    },
  });
}
