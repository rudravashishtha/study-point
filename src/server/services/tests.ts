import { Test, TestLifecycleState, TestType } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult, success, failure } from "./types";
import { resolveEffectivePermissions } from "../../lib/domain/permissions";

const TITLE_MIN = 3;
const TITLE_MAX = 100;
const DESC_MAX = 2000;

export const createTestSchema = z.object({
  batchId: z.string().uuid(),
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(TITLE_MIN).max(TITLE_MAX),
  description: z.string().trim().max(DESC_MAX).optional().nullable(),
  testType: z.nativeEnum(TestType),
  testDate: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
    message: "testDate must be a valid ISO datetime",
  }),
  durationMinutes: z.number().int().positive().optional().nullable(),
  maximumMarks: z.number().int().positive(),
  syllabusDescription: z.string().trim().max(DESC_MAX).optional().nullable(),
  questionPaperFileId: z.string().uuid().optional().nullable(),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;

export const updateTestSchema = z.object({
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(TITLE_MIN).max(TITLE_MAX).optional(),
  description: z.string().trim().max(DESC_MAX).optional().nullable(),
  testType: z.nativeEnum(TestType).optional(),
  testDate: z
    .string()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: "testDate must be a valid ISO datetime",
    })
    .optional(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  maximumMarks: z.number().int().positive().optional(),
  syllabusDescription: z.string().trim().max(DESC_MAX).optional().nullable(),
  questionPaperFileId: z.string().uuid().optional().nullable(),
});

export type UpdateTestInput = z.infer<typeof updateTestSchema>;

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

async function validateChapterAndTopic(
  curriculumTrackId: string,
  chapterId: string | null | undefined,
  topicId: string | null | undefined,
): Promise<ServiceResult<null>> {
  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });
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

async function validateTestFileAsset(
  fileAssetId: string | null | undefined,
  batchId: string,
): Promise<ServiceResult<null>> {
  if (!fileAssetId) return success(null);
  const asset = await prisma.fileAsset.findUnique({
    where: { id: fileAssetId },
  });
  if (!asset) return failure("INVALID_ASSET", "FileAsset not found");
  if (asset.lifecycleState !== "ACTIVE") {
    return failure("INVALID_ASSET", "FileAsset must be ACTIVE");
  }
  if (asset.usageCategory !== "TEST") {
    return failure("USAGE_MISMATCH", "FileAsset usageCategory must be TEST");
  }
  if (asset.targetBatchId !== batchId) {
    return failure("BATCH_MISMATCH", "FileAsset must target the same batch");
  }
  return success(null);
}

async function loadTest(id: string) {
  return prisma.test.findUnique({
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

export async function createTest(
  actorUserId: string,
  input: CreateTestInput,
): Promise<ServiceResult<Test>> {
  const parsed = createTestSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message || "Invalid test data",
    );
  }
  const data = parsed.data;

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  const batch = await prisma.batch.findUnique({
    where: { id: data.batchId },
  });
  if (!batch) return failure("NOT_FOUND", "Batch not found");

  if (actor.role === "TEACHER") {
    if (batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === data.batchId && !a.archivedAt,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("TESTS_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing TESTS_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Cannot create test in archived batch");
  }

  const academicSessionId = batch.academicSessionId;
  const curriculumTrackId = batch.curriculumTrackId;

  const ctResult = await validateChapterAndTopic(
    curriculumTrackId,
    data.chapterId,
    data.topicId,
  );
  if (!ctResult.success) return ctResult;

  const faResult = await validateTestFileAsset(data.questionPaperFileId, data.batchId);
  if (!faResult.success) return faResult;

  const test = await prisma.$transaction(async (tx) => {
    const created = await tx.test.create({
      data: {
        academicSessionId,
        curriculumTrackId,
        batchId: data.batchId,
        chapterId: data.chapterId || null,
        topicId: data.topicId || null,
        title: data.title,
        description: data.description || null,
        testType: data.testType,
        testDate: new Date(data.testDate),
        durationMinutes: data.durationMinutes || null,
        maximumMarks: data.maximumMarks,
        syllabusDescription: data.syllabusDescription || null,
        questionPaperFileId: data.questionPaperFileId || null,
        lifecycleState: "DRAFT",
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "TEST_CREATE",
        entityType: "Test",
        entityId: created.id,
        actorUserId,
        summary: "Test created",
        metadata: { title: data.title, batchId: data.batchId },
      },
    });

    return created;
  });

  return success(test);
}

export async function updateTest(
  actorUserId: string,
  id: string,
  input: UpdateTestInput,
): Promise<ServiceResult<Test>> {
  const existing = await loadTest(id);
  if (!existing) return failure("NOT_FOUND", "Test not found");
  if (existing.lifecycleState === "ARCHIVED") {
    return failure("ARCHIVED", "Cannot update archived test");
  }

  const parsed = updateTestSchema.safeParse(input);
  if (!parsed.success) {
    return failure(
      "INVALID_INPUT",
      parsed.error.issues[0]?.message || "Invalid update data",
    );
  }
  const data = parsed.data;

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
    if (!perms.includes("TESTS_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing TESTS_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  if (data.questionPaperFileId !== undefined) {
    const resolvedFileId =
      data.questionPaperFileId === null ? null : data.questionPaperFileId;
    if (resolvedFileId !== null && resolvedFileId !== existing.questionPaperFileId) {
      const faResult = await validateTestFileAsset(resolvedFileId, existing.batchId);
      if (!faResult.success) return faResult;
    }
  }

  const chapterId = data.chapterId !== undefined ? data.chapterId : existing.chapterId;
  const topicId = data.topicId !== undefined ? data.topicId : existing.topicId;
  const ctResult = await validateChapterAndTopic(
    existing.curriculumTrackId,
    chapterId,
    topicId,
  );
  if (!ctResult.success) return ctResult;

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.chapterId !== undefined) updateData.chapterId = data.chapterId || null;
  if (data.topicId !== undefined) updateData.topicId = data.topicId || null;
  if (data.testType !== undefined) updateData.testType = data.testType;
  if (data.testDate !== undefined) updateData.testDate = new Date(data.testDate);
  if (data.durationMinutes !== undefined)
    updateData.durationMinutes = data.durationMinutes;
  if (data.maximumMarks !== undefined) updateData.maximumMarks = data.maximumMarks;
  if (data.syllabusDescription !== undefined)
    updateData.syllabusDescription = data.syllabusDescription;
  if (data.questionPaperFileId !== undefined)
    updateData.questionPaperFileId = data.questionPaperFileId || null;
  updateData.updatedBy = actorUserId;

  const updated = await prisma.$transaction(async (tx) => {
    const updatedTest = await tx.test.update({
      where: { id },
      data: updateData,
    });

    await tx.auditLog.create({
      data: {
        action: "TEST_UPDATE",
        entityType: "Test",
        entityId: id,
        actorUserId,
        summary: "Test updated",
        metadata: { title: data.title || existing.title },
      },
    });

    return updatedTest;
  });

  return success(updated);
}

export async function publishTest(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<Test>> {
  const existing = await loadTest(id);
  if (!existing) return failure("NOT_FOUND", "Test not found");
  if (existing.lifecycleState === "ARCHIVED") {
    return failure("ARCHIVED", "Cannot publish archived test");
  }
  if (existing.lifecycleState === "PUBLISHED") {
    return failure("ALREADY_PUBLISHED", "Test is already published");
  }

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
    if (!perms.includes("TESTS_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing TESTS_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const published = await tx.test.update({
      where: { id },
      data: {
        lifecycleState: "PUBLISHED",
        publishedAt: existing.publishedAt || new Date(),
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "TEST_PUBLISH",
        entityType: "Test",
        entityId: id,
        actorUserId,
        summary: "Test published",
        metadata: {},
      },
    });

    return published;
  });

  return success(updated);
}

export async function archiveTest(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<Test>> {
  const existing = await loadTest(id);
  if (!existing) return failure("NOT_FOUND", "Test not found");
  if (existing.lifecycleState === "ARCHIVED") {
    return failure("ALREADY_ARCHIVED", "Test is already archived");
  }

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
    if (!perms.includes("TESTS_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing TESTS_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (actor.role === "ADMIN" && existing.batch.archivedAt) {
    return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const archived = await tx.test.update({
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
        action: "TEST_ARCHIVE",
        entityType: "Test",
        entityId: id,
        actorUserId,
        summary: "Test archived",
        metadata: {},
      },
    });

    return archived;
  });

  return success(updated);
}

export async function listAdminTests(
  actorUserId: string,
  params: {
    batchId?: string;
    academicSessionId?: string;
    curriculumTrackId?: string;
    lifecycleState?: TestLifecycleState;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<
  ServiceResult<{ items: Test[]; total: number; page: number; pageSize: number }>
> {
  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
  });
  if (!actor || actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));

  const where: Record<string, unknown> = {};
  if (params.batchId) where.batchId = params.batchId;
  if (params.academicSessionId) where.academicSessionId = params.academicSessionId;
  if (params.curriculumTrackId) where.curriculumTrackId = params.curriculumTrackId;
  if (params.lifecycleState) where.lifecycleState = params.lifecycleState;

  const [total, items] = await prisma.$transaction([
    prisma.test.count({ where }),
    prisma.test.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        batch: {
          include: {
            curriculumTrack: { include: { board: true, subject: true } },
          },
        },
        chapter: true,
        topic: true,
        fileAsset: true,
      },
    }),
  ]);

  return success({ items, total, page, pageSize });
}

export async function listTeacherBatchTests(
  actorUserId: string,
  batchId: string,
  params: {
    lifecycleState?: TestLifecycleState;
    page?: number;
    pageSize?: number;
  } = {},
): Promise<
  ServiceResult<{ items: Test[]; total: number; page: number; pageSize: number }>
> {
  const authResult = await loadTeacherAuth(actorUserId, batchId);
  if (!authResult.success) return authResult;
  const { permissions } = authResult.data;
  if (!permissions.includes("TESTS_VIEW") && !permissions.includes("TESTS_MANAGE")) {
    return failure("UNAUTHORIZED", "Missing TESTS_VIEW permission");
  }

  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize || 20));

  const where: Record<string, unknown> = { batchId };
  if (params.lifecycleState) where.lifecycleState = params.lifecycleState;

  const [total, items] = await prisma.$transaction([
    prisma.test.count({ where }),
    prisma.test.findMany({
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

export async function listStudentTests(
  actorUserId: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<
  ServiceResult<{ items: Test[]; total: number; page: number; pageSize: number }>
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
    lifecycleState: "PUBLISHED" as TestLifecycleState,
  };

  const [total, items] = await prisma.$transaction([
    prisma.test.count({ where }),
    prisma.test.findMany({
      where,
      orderBy: [{ testDate: "asc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        batch: {
          include: {
            curriculumTrack: { include: { board: true, subject: true } },
          },
        },
        chapter: true,
        topic: true,
      },
    }),
  ]);

  const sanitizedItems = items.map((item) => {
    const { questionPaperFileId, ...rest } = item;
    void questionPaperFileId;
    return rest;
  }) as unknown as Test[];

  return success({ items: sanitizedItems, total, page, pageSize });
}

export async function getTestDownloadUrl(
  actorUserId: string,
  testId: string,
): Promise<ServiceResult<string>> {
  const test = await loadTest(testId);

  if (
    !test ||
    !test.questionPaperFileId ||
    !test.fileAsset ||
    test.fileAsset.lifecycleState !== "ACTIVE"
  ) {
    return failure("NOT_FOUND", "Downloadable question paper not found");
  }

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: {
      teacher: {
        include: { teacherAssignments: { where: { archivedAt: null } } },
      },
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
      (a) => a.batchId === test.batchId,
    );
    if (assignment) {
      const perms = resolveEffectivePermissions(assignment.permissions);
      if (perms.includes("TESTS_VIEW") || perms.includes("TESTS_MANAGE")) {
        authorized = true;
      }
    }
  }

  // B9.1: Student question-paper download is explicitly deferred
  if (!authorized) {
    return failure("UNAUTHORIZED", "Not authorized to download question paper");
  }

  const { getDownloadUrl } = await import("./file-assets");
  return getDownloadUrl(test.questionPaperFileId);
}
