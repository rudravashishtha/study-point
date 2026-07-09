import { Homework, HomeworkLifecycleState, Role } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult, success, failure } from "./types";
import { resolveEffectivePermissions } from "../../lib/domain/permissions";

const HOMEWORK_TITLE_MIN = 3;
const HOMEWORK_TITLE_MAX = 100;
const HOMEWORK_DESC_MAX = 2000;

export const createHomeworkSchema = z.object({
  batchId: z.string().uuid(),
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(HOMEWORK_TITLE_MIN).max(HOMEWORK_TITLE_MAX),
  description: z.string().trim().max(HOMEWORK_DESC_MAX).optional().nullable(),
  fileAssetId: z.string().uuid().optional().nullable(),
  assignedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "assignedDate must be YYYY-MM-DD"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD"),
});

export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>;

export const updateHomeworkSchema = z.object({
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(HOMEWORK_TITLE_MIN).max(HOMEWORK_TITLE_MAX).optional(),
  description: z.string().trim().max(HOMEWORK_DESC_MAX).optional().nullable(),
  fileAssetId: z.string().uuid().optional().nullable(),
  assignedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>;

function dateFromString(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

interface TeacherAuth {
  teacherId: string;
  batchId: string;
  permissions: string[];
  hasActiveAssignment: boolean;
}

async function loadTeacherAuth(
  actorUserId: string,
  batchId?: string,
): Promise<ServiceResult<TeacherAuth>> {
  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: {
      teacher: {
        include: {
          teacherAssignments: {
            where: batchId ? { batchId } : undefined,
          },
        },
      },
    },
  });

  if (!actor || !actor.teacherId || !actor.teacher) {
    return failure("UNAUTHORIZED", "Teacher actor required");
  }

  const assignment = batchId
    ? actor.teacher.teacherAssignments.find((a) => !a.archivedAt && a.batchId === batchId)
    : null;

  const effectivePerms = assignment
    ? resolveEffectivePermissions(assignment.permissions)
    : [];

  return success({
    teacherId: actor.teacherId,
    batchId: batchId || "",
    permissions: effectivePerms,
    hasActiveAssignment: !!assignment,
  });
}

async function checkBatchNotArchived(batchId: string): Promise<ServiceResult<null>> {
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return failure("NOT_FOUND", "Batch not found");
  if (batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
  return success(null);
}

async function validateChapterAndTopic(
  curriculumTrackId: string,
  chapterId: string | null | undefined,
  topicId: string | null | undefined,
): Promise<ServiceResult<null>> {
  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (!chapter) return failure("NOT_FOUND", "Chapter not found");
    if (chapter.curriculumTrackId !== curriculumTrackId) {
      return failure("INVALID_CHAPTER", "Chapter does not belong to this track");
    }
  }
  if (topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) return failure("NOT_FOUND", "Topic not found");
    if (chapterId && topic.chapterId !== chapterId) {
      return failure("INVALID_TOPIC", "Topic does not belong to this chapter");
    }
    if (!chapterId) {
      const topicChapter = await prisma.topic.findUnique({
        where: { id: topicId },
        include: { chapter: true },
      });
      if (!topicChapter || !topicChapter.chapter) {
        return failure("NOT_FOUND", "Topic's chapter not found");
      }
      if (topicChapter.chapter.curriculumTrackId !== curriculumTrackId) {
        return failure("INVALID_TOPIC", "Topic does not belong to this track");
      }
    }
  }
  return success(null);
}

async function validateFileAsset(
  fileAssetId: string | null | undefined,
  batchId: string,
): Promise<ServiceResult<null>> {
  if (!fileAssetId) return success(null);
  const asset = await prisma.fileAsset.findUnique({ where: { id: fileAssetId } });
  if (!asset) return failure("INVALID_ASSET", "FileAsset not found");
  if (asset.lifecycleState !== "ACTIVE") {
    return failure("INVALID_ASSET", "FileAsset must be ACTIVE");
  }
  if (asset.usageCategory !== "HOMEWORK") {
    return failure("USAGE_MISMATCH", "FileAsset usageCategory must be HOMEWORK");
  }
  if (asset.targetBatchId !== batchId) {
    return failure("BATCH_MISMATCH", "FileAsset must target the same batch");
  }
  return success(null);
}

function validateDates(assignedDate: string, dueDate: string): ServiceResult<null> {
  if (dueDate < assignedDate) {
    return failure("INVALID_DATES", "dueDate must be >= assignedDate");
  }
  return success(null);
}

async function loadHomework(id: string) {
  return prisma.homework.findUnique({
    where: { id },
    include: {
      batch: true,
      academicSession: true,
      curriculumTrack: true,
      chapter: true,
      topic: true,
      fileAsset: true,
    },
  });
}

export async function createHomework(
  actorUserId: string,
  input: CreateHomeworkInput,
): Promise<ServiceResult<Homework>> {
  const parsed = createHomeworkSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message || "Invalid homework data",
    );
  }
  const data = parsed.data;

  const dateValidation = validateDates(data.assignedDate, data.dueDate);
  if (!dateValidation.success) return dateValidation;

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  // Check batch exists and get session/track
  const batch = await prisma.batch.findUnique({ where: { id: data.batchId } });
  if (!batch) return failure("NOT_FOUND", "Batch not found");

  if (actor.role === "TEACHER") {
    if (batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === data.batchId && !a.archivedAt,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("HOMEWORK_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing HOMEWORK_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Cannot create homework in archived batch");
  }

  // Derive session and track from batch
  const academicSessionId = batch.academicSessionId;
  const curriculumTrackId = batch.curriculumTrackId;

  // Validate chapter/topic belongs to track
  const ctResult = await validateChapterAndTopic(
    curriculumTrackId,
    data.chapterId,
    data.topicId,
  );
  if (!ctResult.success) return ctResult;

  // Validate file asset
  const faResult = await validateFileAsset(data.fileAssetId, data.batchId);
  if (!faResult.success) return faResult;

  const homework = await prisma.$transaction(async (tx) => {
    const created = await tx.homework.create({
      data: {
        academicSessionId,
        curriculumTrackId,
        batchId: data.batchId,
        chapterId: data.chapterId || null,
        topicId: data.topicId || null,
        title: data.title,
        description: data.description || null,
        fileAssetId: data.fileAssetId || null,
        assignedDate: dateFromString(data.assignedDate),
        dueDate: dateFromString(data.dueDate),
        lifecycleState: "DRAFT",
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "HOMEWORK_CREATE",
        entityType: "Homework",
        entityId: created.id,
        actorUserId,
        summary: "Homework created",
        metadata: { title: data.title, batchId: data.batchId },
      },
    });

    return created;
  });

  return success(homework);
}

export async function updateHomework(
  actorUserId: string,
  id: string,
  input: UpdateHomeworkInput,
): Promise<ServiceResult<Homework>> {
  const existing = await loadHomework(id);
  if (!existing) return failure("NOT_FOUND", "Homework not found");
  if (existing.lifecycleState === "ARCHIVED") {
    return failure("ARCHIVED", "Cannot update archived homework");
  }

  const parsed = updateHomeworkSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message || "Invalid update data",
    );
  }
  const data = parsed.data;

  // Validate dates if both provided, or if one is provided and the other exists
  const assignedDate =
    data.assignedDate || existing.assignedDate.toISOString().slice(0, 10);
  const dueDate = data.dueDate || existing.dueDate.toISOString().slice(0, 10);
  const dateValidation = validateDates(assignedDate, dueDate);
  if (!dateValidation.success) return dateValidation;

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (existing.batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === existing.batchId && !a.archivedAt,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("HOMEWORK_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing HOMEWORK_MANAGE");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  // Validate file asset
  if (data.fileAssetId && data.fileAssetId !== existing.fileAssetId) {
    const faResult = await validateFileAsset(data.fileAssetId, existing.batchId);
    if (!faResult.success) return faResult;
  }

  // Validate chapter/topic
  const chapterId = data.chapterId !== undefined ? data.chapterId : existing.chapterId;
  const topicId = data.topicId !== undefined ? data.topicId : existing.topicId;
  const ctResult = await validateChapterAndTopic(
    existing.curriculumTrackId,
    chapterId,
    topicId,
  );
  if (!ctResult.success) return ctResult;

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.chapterId !== undefined) updateData.chapterId = data.chapterId || null;
  if (data.topicId !== undefined) updateData.topicId = data.topicId || null;
  if (data.fileAssetId !== undefined) updateData.fileAssetId = data.fileAssetId || null;
  if (data.assignedDate !== undefined)
    updateData.assignedDate = dateFromString(data.assignedDate);
  if (data.dueDate !== undefined) updateData.dueDate = dateFromString(data.dueDate);
  updateData.updatedBy = actorUserId;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedHw = await tx.homework.update({
      where: { id },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        action: "HOMEWORK_UPDATE",
        entityType: "Homework",
        entityId: id,
        actorUserId,
        summary: "Homework updated",
        metadata: { title: data.title || existing.title },
      },
    });

    return updatedHw;
  });

  return success(updated);
}

export async function publishHomework(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<Homework>> {
  const existing = await loadHomework(id);
  if (!existing) return failure("NOT_FOUND", "Homework not found");
  if (existing.lifecycleState === "ARCHIVED") {
    return failure("ARCHIVED", "Cannot publish archived homework");
  }
  if (existing.lifecycleState === "PUBLISHED")
    return failure("ALREADY_PUBLISHED", "Homework is already published");

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (existing.batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === existing.batchId && !a.archivedAt,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("HOMEWORK_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing HOMEWORK_MANAGE");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const published = await tx.homework.update({
      where: { id },
      data: {
        lifecycleState: "PUBLISHED",
        publishedAt: existing.publishedAt || new Date(),
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "HOMEWORK_PUBLISH",
        entityType: "Homework",
        entityId: id,
        actorUserId,
        summary: "Homework published",
        metadata: {},
      },
    });

    return published;
  });

  return success(updated);
}

export async function archiveHomework(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<Homework>> {
  const existing = await loadHomework(id);
  if (!existing) return failure("NOT_FOUND", "Homework not found");
  if (existing.lifecycleState === "ARCHIVED") return success(existing);

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (existing.batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === existing.batchId && !a.archivedAt,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("HOMEWORK_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing HOMEWORK_MANAGE");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const archived = await tx.homework.update({
      where: { id },
      data: {
        lifecycleState: "ARCHIVED",
        archivedAt: new Date(),
        archivedBy: actorUserId,
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "HOMEWORK_ARCHIVE",
        entityType: "Homework",
        entityId: id,
        actorUserId,
        summary: "Homework archived",
        metadata: {},
      },
    });

    return archived;
  });

  return success(updated);
}

export async function listAdminHomework(
  actorUserId: string,
  params: {
    batchId?: string;
    academicSessionId?: string;
    curriculumTrackId?: string;
    lifecycleState?: HomeworkLifecycleState;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<
  ServiceResult<{ items: Homework[]; total: number; page: number; pageSize: number }>
> {
  const actor = await prisma.appUser.findUnique({ where: { id: actorUserId } });
  if (!actor || actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));

  const where: any = {};
  if (params.batchId) where.batchId = params.batchId;
  if (params.academicSessionId) where.academicSessionId = params.academicSessionId;
  if (params.curriculumTrackId) where.curriculumTrackId = params.curriculumTrackId;
  if (params.lifecycleState) where.lifecycleState = params.lifecycleState;

  const [total, items] = await prisma.$transaction([
    prisma.homework.count({ where }),
    prisma.homework.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        batch: {
          include: { curriculumTrack: { include: { board: true, subject: true } } },
        },
        chapter: true,
        topic: true,
        fileAsset: true,
      },
    }),
  ]);

  return success({ items, total, page, pageSize });
}

export async function listTeacherBatchHomework(
  actorUserId: string,
  batchId: string,
  params: {
    lifecycleState?: HomeworkLifecycleState;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<
  ServiceResult<{ items: Homework[]; total: number; page: number; pageSize: number }>
> {
  const authResult = await loadTeacherAuth(actorUserId, batchId);
  if (!authResult.success) return authResult;
  const { permissions } = authResult.data;
  if (
    !permissions.includes("HOMEWORK_VIEW") &&
    !permissions.includes("HOMEWORK_MANAGE")
  ) {
    return failure("UNAUTHORIZED", "Missing HOMEWORK_VIEW permission");
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));

  const where: any = { batchId };
  if (params.lifecycleState) where.lifecycleState = params.lifecycleState;

  const [total, items] = await prisma.$transaction([
    prisma.homework.count({ where }),
    prisma.homework.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        chapter: true,
        topic: true,
        fileAsset: true,
      },
    }),
  ]);

  return success({ items, total, page, pageSize });
}

export async function listStudentHomework(
  actorUserId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<
  ServiceResult<{ items: Homework[]; total: number; page: number; pageSize: number }>
> {
  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: {
      student: {
        include: {
          enrolments: {
            where: { status: "active", archivedAt: null },
            include: { batch: true },
          },
        },
      },
    },
  });

  if (!actor || actor.role !== "STUDENT" || !actor.studentId || !actor.student) {
    return failure("UNAUTHORIZED", "Valid student required");
  }

  const activeEnrolments = actor.student.enrolments;
  if (activeEnrolments.length === 0) {
    return success({ items: [], total: 0, page: 1, pageSize: 20 });
  }

  const validBatchIds = activeEnrolments
    .filter((e) => e.batch && !e.batch.archivedAt)
    .map((e) => e.batchId)
    .filter((id): id is string => id !== null);

  if (validBatchIds.length === 0) {
    return success({ items: [], total: 0, page: 1, pageSize: 20 });
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));

  const where = {
    batchId: { in: validBatchIds },
    lifecycleState: "PUBLISHED" as HomeworkLifecycleState,
  };

  const [total, items] = await prisma.$transaction([
    prisma.homework.count({ where }),
    prisma.homework.findMany({
      where,
      orderBy: [{ dueDate: "asc" }, { assignedDate: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        batch: {
          include: { curriculumTrack: { include: { board: true, subject: true } } },
        },
        chapter: true,
        topic: true,
        fileAsset: true,
      },
    }),
  ]);

  return success({ items, total, page, pageSize });
}

export async function getHomeworkDownloadUrl(
  actorUserId: string,
  homeworkId: string,
): Promise<ServiceResult<string>> {
  const homework = await loadHomework(homeworkId);

  if (
    !homework ||
    !homework.fileAssetId ||
    !homework.fileAsset ||
    homework.fileAsset.lifecycleState !== "ACTIVE"
  ) {
    return failure("NOT_FOUND", "Downloadable attachment not found");
  }

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: {
      teacher: { include: { teacherAssignments: { where: { archivedAt: null } } } },
      student: {
        include: {
          enrolments: {
            where: { status: "active", archivedAt: null },
            include: { batch: true },
          },
        },
      },
    },
  });

  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  let authorized = false;

  if (actor.role === "ADMIN") {
    authorized = true;
  } else if (actor.role === "TEACHER" && actor.teacher) {
    const assignment = actor.teacher.teacherAssignments.find(
      (a: any) => a.batchId === homework.batchId,
    );
    if (assignment) {
      const perms = resolveEffectivePermissions(assignment.permissions);
      if (perms.includes("HOMEWORK_VIEW") || perms.includes("HOMEWORK_MANAGE")) {
        authorized = true;
      }
    }
  } else if (actor.role === "STUDENT" && actor.student) {
    if (homework.lifecycleState === "PUBLISHED" && !homework.batch.archivedAt) {
      authorized = actor.student.enrolments.some(
        (e: any) => e.batchId === homework.batchId && e.batch && !e.batch.archivedAt,
      );
    }
  }

  if (!authorized) {
    return failure("UNAUTHORIZED", "Not authorized to download this attachment");
  }

  const { getDownloadUrl } = await import("./file-assets");
  return getDownloadUrl(homework.fileAssetId);
}
