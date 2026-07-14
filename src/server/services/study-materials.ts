import {
  ClassLevel,
  Prisma,
  StudyMaterial,
  StudyMaterialResourceType,
  StudyMaterialVisibility,
} from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult, success, failure } from "./types";
import { resolveEffectivePermissions } from "../../lib/domain/permissions";

export const createStudyMaterialSchema = z.object({
  academicSessionId: z.string().uuid(),
  curriculumTrackId: z.string().uuid(),
  batchId: z.string().uuid().optional().nullable(),
  chapterId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  resourceType: z.nativeEnum(StudyMaterialResourceType),
  fileAssetId: z.string().uuid().optional().nullable(),
  externalLinkUrl: z.string().url().optional().nullable(),
  visibility: z.nativeEnum(StudyMaterialVisibility),
});

export type CreateStudyMaterialInput = z.infer<typeof createStudyMaterialSchema>;
export type UpdateStudyMaterialInput = Partial<CreateStudyMaterialInput>;

export async function createStudyMaterial(
  actorUserId: string,
  input: CreateStudyMaterialInput,
): Promise<ServiceResult<StudyMaterial>> {
  const parsed = createStudyMaterialSchema.safeParse(input);
  if (!parsed.success) return failure("INVALID_INPUT", "Invalid study material input");
  const data = parsed.data;

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (data.visibility === "BATCH" && !data.batchId) {
    return failure("INVALID_VISIBILITY", "BATCH visibility requires batchId");
  }
  if (data.visibility === "CURRICULUM_TRACK" && data.batchId) {
    return failure(
      "INVALID_VISIBILITY",
      "CURRICULUM_TRACK visibility cannot have batchId",
    );
  }

  // Authorization
  if (actor.role === "TEACHER") {
    if (data.visibility === "CURRICULUM_TRACK") {
      return failure("UNAUTHORIZED", "Teachers cannot create CURRICULUM_TRACK materials");
    }
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === data.batchId && a.archivedAt === null,
    );
    if (!assignment) {
      return failure("UNAUTHORIZED", "Not assigned to this batch");
    }
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("MATERIALS_MANAGE")) {
      return failure("UNAUTHORIZED", "Missing MATERIALS_MANAGE permission");
    }
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  // Verify FileAsset
  if (data.fileAssetId) {
    const asset = await prisma.fileAsset.findUnique({ where: { id: data.fileAssetId } });
    if (!asset || asset.lifecycleState !== "ACTIVE") {
      return failure("INVALID_ASSET", "Active FileAsset required");
    }
    // Scope check
    if (data.visibility === "BATCH" && asset.uploadScope !== "BATCH") {
      return failure("SCOPE_MISMATCH", "Asset scope must be BATCH");
    }
    if (
      data.visibility === "CURRICULUM_TRACK" &&
      asset.uploadScope !== "CURRICULUM_TRACK"
    ) {
      return failure("SCOPE_MISMATCH", "Asset scope must be CURRICULUM_TRACK");
    }
  }

  // Check Batch
  if (data.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: data.batchId } });
    if (!batch) return failure("NOT_FOUND", "Batch not found");
    if (batch.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const material = await prisma.$transaction(async (tx) => {
    const created = await tx.studyMaterial.create({
      data: {
        ...data,
        lifecycleState: "DRAFT",
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STUDY_MATERIAL_CREATE",
        entityType: "StudyMaterial",
        entityId: created.id,
        actorUserId: actorUserId,
        summary: "Material created",
        metadata: { title: data.title },
      },
    });

    return created;
  });

  return success(material);
}

export async function updateStudyMaterial(
  actorUserId: string,
  id: string,
  input: UpdateStudyMaterialInput,
): Promise<ServiceResult<StudyMaterial>> {
  const material = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!material) return failure("NOT_FOUND", "Material not found");
  if (material.lifecycleState === "ARCHIVED")
    return failure("ARCHIVED", "Cannot update archived material");

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (material.visibility === "CURRICULUM_TRACK") {
      return failure("UNAUTHORIZED", "Teachers cannot edit CURRICULUM_TRACK materials");
    }
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === material.batchId && a.archivedAt === null,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("MATERIALS_MANAGE"))
      return failure("UNAUTHORIZED", "Missing MATERIALS_MANAGE");
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  // Prevent scope widening/swapping
  if (input.visibility && input.visibility !== material.visibility) {
    return failure("INVALID_UPDATE", "Cannot change visibility scope");
  }
  if (input.batchId && input.batchId !== material.batchId) {
    return failure("INVALID_UPDATE", "Cannot change batch");
  }
  if (input.curriculumTrackId && input.curriculumTrackId !== material.curriculumTrackId) {
    return failure("INVALID_UPDATE", "Cannot change curriculum track");
  }

  if (material.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: material.batchId } });
    if (batch?.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  if (input.fileAssetId && input.fileAssetId !== material.fileAssetId) {
    const asset = await prisma.fileAsset.findUnique({ where: { id: input.fileAssetId } });
    if (!asset || asset.lifecycleState !== "ACTIVE")
      return failure("INVALID_ASSET", "Active FileAsset required");
    if (material.visibility === "BATCH" && asset.uploadScope !== "BATCH")
      return failure("SCOPE_MISMATCH", "Asset must be BATCH");
    if (
      material.visibility === "CURRICULUM_TRACK" &&
      asset.uploadScope !== "CURRICULUM_TRACK"
    )
      return failure("SCOPE_MISMATCH", "Asset must be CURRICULUM_TRACK");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMat = await tx.studyMaterial.update({
      where: { id },
      data: {
        ...input,
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STUDY_MATERIAL_UPDATE",
        entityType: "StudyMaterial",
        entityId: id,
        actorUserId: actorUserId,
        summary: "Material updated",
        metadata: { title: input.title || material.title },
      },
    });

    return updatedMat;
  });

  return success(updated);
}

export async function publishStudyMaterial(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<StudyMaterial>> {
  const material = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!material) return failure("NOT_FOUND", "Material not found");
  if (material.lifecycleState === "ARCHIVED")
    return failure("ARCHIVED", "Cannot publish archived material");
  if (material.lifecycleState === "PUBLISHED") return success(material);

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (material.visibility === "CURRICULUM_TRACK")
      return failure(
        "UNAUTHORIZED",
        "Teachers cannot publish CURRICULUM_TRACK materials",
      );
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === material.batchId && a.archivedAt === null,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("MATERIALS_MANAGE"))
      return failure("UNAUTHORIZED", "Missing MATERIALS_MANAGE");
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  if (material.batchId) {
    const batch = await prisma.batch.findUnique({ where: { id: material.batchId } });
    if (batch?.archivedAt) return failure("ARCHIVED_BATCH", "Batch is archived");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMat = await tx.studyMaterial.update({
      where: { id },
      data: {
        lifecycleState: "PUBLISHED",
        publishedAt: material.publishedAt || new Date(),
        updatedBy: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "STUDY_MATERIAL_PUBLISH",
        entityType: "StudyMaterial",
        entityId: id,
        actorUserId: actorUserId,
        summary: "Material published",
        metadata: {},
      },
    });

    return updatedMat;
  });

  return success(updated);
}

export async function archiveStudyMaterial(
  actorUserId: string,
  id: string,
): Promise<ServiceResult<StudyMaterial>> {
  const material = await prisma.studyMaterial.findUnique({ where: { id } });
  if (!material) return failure("NOT_FOUND", "Material not found");
  if (material.lifecycleState === "ARCHIVED") return success(material);

  const actor = await prisma.appUser.findUnique({
    where: { id: actorUserId },
    include: { teacher: { include: { teacherAssignments: true } } },
  });
  if (!actor) return failure("UNAUTHORIZED", "Actor not found");

  if (actor.role === "TEACHER") {
    if (material.visibility === "CURRICULUM_TRACK")
      return failure(
        "UNAUTHORIZED",
        "Teachers cannot archive CURRICULUM_TRACK materials",
      );
    const assignment = actor.teacher?.teacherAssignments.find(
      (a) => a.batchId === material.batchId && a.archivedAt === null,
    );
    if (!assignment) return failure("UNAUTHORIZED", "Not assigned to this batch");
    const perms = resolveEffectivePermissions(assignment.permissions);
    if (!perms.includes("MATERIALS_MANAGE"))
      return failure("UNAUTHORIZED", "Missing MATERIALS_MANAGE");
  } else if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Insufficient permissions");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedMat = await tx.studyMaterial.update({
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
        action: "STUDY_MATERIAL_ARCHIVE",
        entityType: "StudyMaterial",
        entityId: id,
        actorUserId: actorUserId,
        summary: "Material archived",
        metadata: {},
      },
    });

    return updatedMat;
  });

  return success(updated);
}

export interface StudentMaterialListItem {
  id: string;
  title: string;
  description: string | null;
  resourceType: StudyMaterialResourceType;
  textContent: string | null;
  fileAssetId: string | null;
  externalLinkUrl: string | null;
  visibility: StudyMaterialVisibility;
  publishedAt: Date | null;
  classLevel: ClassLevel;
  subjectName: string;
  chapterName: string | null;
  topicName: string | null;
}

export interface ListStudentMaterialsInput {
  page?: number;
  pageSize?: number;
  q?: string | null;
  classLevel?: ClassLevel | null;
  curriculumTrackId?: string | null;
  resourceType?: StudyMaterialResourceType | null;
  sort?: "publishedAt" | "title";
  direction?: "asc" | "desc";
}

export interface ListStudentMaterialsResult {
  items: StudentMaterialListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listStudentMaterials(
  actorUserId: string,
  input: ListStudentMaterialsInput = {},
): Promise<ServiceResult<ListStudentMaterialsResult>> {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize ?? 20)));
  const q = input.q?.trim() || null;
  const sort = input.sort ?? "publishedAt";
  const direction = input.direction ?? "desc";

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
    return success({ items: [], total: 0, page, pageSize, totalPages: 1 });
  }

  const sessionIds = [...new Set(activeEnrolments.map((e) => e.academicSessionId))];
  const trackIds = [...new Set(activeEnrolments.map((e) => e.curriculumTrackId))];

  // Exclude archived batches
  const validBatchIds = activeEnrolments
    .filter((e) => e.batch && !e.batch.archivedAt)
    .map((e) => e.batchId)
    .filter((id): id is string => id !== null);

  const where: Prisma.StudyMaterialWhereInput = {
    lifecycleState: "PUBLISHED",
  };

  const and: Prisma.StudyMaterialWhereInput[] = [
    {
      OR: [
        {
          visibility: "CURRICULUM_TRACK",
          academicSessionId: { in: sessionIds },
          curriculumTrackId: { in: trackIds },
        },
        {
          visibility: "BATCH",
          batchId: { in: validBatchIds },
        },
      ],
    },
  ];

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  where.AND = and;

  if (input.classLevel) {
    where.curriculumTrack = { classLevel: input.classLevel };
  }
  if (input.curriculumTrackId) {
    where.curriculumTrackId = input.curriculumTrackId;
  }
  if (input.resourceType) {
    where.resourceType = input.resourceType;
  }

  const orderBy: Prisma.StudyMaterialOrderByWithRelationInput =
    sort === "title" ? { title: direction } : { publishedAt: direction };

  const [total, materials] = await prisma.$transaction([
    prisma.studyMaterial.count({ where }),
    prisma.studyMaterial.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        chapter: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
        curriculumTrack: { include: { subject: true } },
      },
    }),
  ]);

  const items: StudentMaterialListItem[] = materials.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    resourceType: m.resourceType,
    textContent: m.textContent,
    fileAssetId: m.fileAssetId,
    externalLinkUrl: m.externalLinkUrl,
    visibility: m.visibility,
    publishedAt: m.publishedAt,
    classLevel: m.curriculumTrack.classLevel,
    subjectName: m.curriculumTrack.subject.name,
    chapterName: m.chapter?.name ?? null,
    topicName: m.topic?.name ?? null,
  }));

  return success({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

export async function listPublicResources(
  page: number = 1,
  pageSize: number = 60,
): Promise<
  ServiceResult<
    Array<{
      id: string;
      title: string;
      description: string | null;
      resourceType: string;
      visibility: string;
      publishedAt: Date | null;
      externalLinkUrl: string | null;
      fileAssetId: string | null;
      fileName: string | null;
    }>
  >
> {
  if (page < 1) page = 1;
  if (pageSize > 100) pageSize = 100;

  const materials = await prisma.studyMaterial.findMany({
    where: {
      lifecycleState: "PUBLISHED",
      visibility: "CURRICULUM_TRACK",
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: { fileAsset: true },
  });

  return success(
    materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      resourceType: m.resourceType,
      visibility: m.visibility,
      publishedAt: m.publishedAt,
      externalLinkUrl: m.externalLinkUrl,
      fileAssetId: m.fileAssetId,
      fileName: m.fileAsset ? m.fileAsset.originalFilename : null,
    })),
  );
}

export async function getMaterialDownloadUrl(
  actorUserId: string,
  materialId: string,
): Promise<ServiceResult<string>> {
  const material = await prisma.studyMaterial.findUnique({
    where: { id: materialId },
    include: { fileAsset: true },
  });

  if (
    !material ||
    !material.fileAssetId ||
    !material.fileAsset ||
    material.fileAsset.lifecycleState !== "ACTIVE"
  ) {
    return failure("NOT_FOUND", "Downloadable material not found");
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
    if (material.visibility === "BATCH" && material.batchId) {
      const assignment = actor.teacher.teacherAssignments.find(
        (a) => a.batchId === material.batchId,
      );
      if (assignment) {
        const perms = resolveEffectivePermissions(assignment.permissions);
        if (perms.includes("MATERIALS_VIEW") || perms.includes("MATERIALS_MANAGE")) {
          authorized = true;
        }
      }
    }
  } else if (actor.role === "STUDENT" && actor.student) {
    if (material.lifecycleState === "PUBLISHED") {
      const activeEnrolments = actor.student.enrolments;
      if (material.visibility === "BATCH" && material.batchId) {
        authorized = activeEnrolments.some(
          (e) => e.batchId === material.batchId && e.batch && !e.batch.archivedAt,
        );
      } else if (material.visibility === "CURRICULUM_TRACK") {
        authorized = activeEnrolments.some(
          (e) =>
            e.academicSessionId === material.academicSessionId &&
            e.curriculumTrackId === material.curriculumTrackId,
        );
      }
    }
  }

  if (!authorized) {
    return failure("UNAUTHORIZED", "Not authorized to download this material");
  }

  const { getDownloadUrl } = await import("./file-assets");
  return getDownloadUrl(material.fileAssetId);
}
