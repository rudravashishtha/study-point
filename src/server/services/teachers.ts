import { Prisma } from "@prisma/client";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";

export interface CreateTeacherParams {
  displayName: string;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  photoFileId?: string | null;
  subjects?: string[];
}

export interface UpdateTeacherParams {
  displayName?: string;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  qualifications?: string | null;
  photoFileId?: string | null;
  subjects?: string[];
  active?: boolean;
}

export async function createTeacher(actor: ActorContext, params: CreateTeacherParams) {
  return await db.$transaction(async (tx) => {
    const teacher = await tx.teacher.create({
      data: {
        displayName: params.displayName,
        phone: params.phone,
        email: params.email,
        bio: params.bio,
        qualifications: params.qualifications,
        photoFileId: params.photoFileId,
        subjects: params.subjects || [],
        active: true,
      },
    });

    await createAuditLog(tx, actor, {
      action: "CREATE",
      entityType: "TEACHER",
      entityId: teacher.id,
      summary: `Created Teacher profile for ${teacher.displayName}`,
      metadata: { params },
    });

    return { type: "SUCCESS" as const, data: teacher };
  });
}

export async function updateTeacher(
  actor: ActorContext,
  id: string,
  params: UpdateTeacherParams,
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.teacher.findUnique({
      where: { id },
      select: { active: true },
    });

    if (!existing) {
      return { type: "NOT_FOUND" as const };
    }

    if (!existing.active) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Cannot update an inactive Teacher",
      };
    }

    const teacher = await tx.teacher.update({
      where: { id },
      data: params,
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "TEACHER",
      entityId: teacher.id,
      summary: `Updated Teacher profile for ${teacher.displayName}`,
      metadata: { params },
    });

    return { type: "SUCCESS" as const, data: teacher };
  });
}

export async function getTeacher(id: string) {
  const teacher = await db.teacher.findUnique({
    where: { id },
    include: {
      appUser: {
        select: { status: true },
      },
    },
  });
  if (!teacher) return null;
  return teacher;
}

export interface ListTeachersOptions {
  status?: "active" | "inactive" | "all";
  q?: string;
  page?: number;
  limit?: number;
  sort?: "displayName" | "createdAt";
  direction?: "asc" | "desc";
}

export async function listTeachers(options?: ListTeachersOptions) {
  const status = options?.status ?? "active";
  const where: Prisma.TeacherWhereInput = {};

  if (status === "active") where.active = true;
  if (status === "inactive") where.active = false;

  if (options?.q) {
    where.OR = [
      { displayName: { contains: options.q, mode: "insensitive" } },
      { email: { contains: options.q, mode: "insensitive" } },
      { phone: { contains: options.q, mode: "insensitive" } },
    ];
  }

  const sortField = options?.sort ?? "displayName";
  const direction = options?.direction ?? "asc";

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    db.teacher.findMany({
      where,
      orderBy: { [sortField]: direction },
      skip,
      take: limit,
      include: {
        appUser: {
          select: { status: true },
        },
      },
    }),
    db.teacher.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function archiveTeacher(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.teacher.findUnique({
      where: { id },
      select: { active: true, displayName: true },
    });

    if (!existing) {
      return { type: "NOT_FOUND" as const };
    }

    if (!existing.active) {
      return {
        type: "INVALID_LIFECYCLE" as const,
        reason: "Teacher is already inactive",
      };
    }

    // Check for active assignments
    const activeAssignments = await tx.teacherAssignment.count({
      where: { teacherId: id, archivedAt: null },
    });

    if (activeAssignments > 0) {
      return {
        type: "ARCHIVE_BLOCKED" as const,
        reason: "Teacher has active assignments",
      };
    }

    const teacher = await tx.teacher.update({
      where: { id },
      data: { active: false },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "TEACHER",
      entityId: teacher.id,
      summary: `Deactivated Teacher profile for ${existing.displayName}`,
    });

    return { type: "SUCCESS" as const, data: teacher };
  });
}

export async function restoreTeacher(actor: ActorContext, id: string) {
  const existing = await db.teacher.findUnique({
    where: { id },
    select: { active: true, displayName: true },
  });

  if (!existing) {
    return { type: "NOT_FOUND" as const };
  }

  // Restore already active Teacher → true no-op with zero transaction and zero audit logs
  if (existing.active) {
    return { type: "SUCCESS" as const };
  }

  return await db.$transaction(async (tx) => {
    const teacher = await tx.teacher.update({
      where: { id },
      data: { active: true },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "TEACHER",
      entityId: teacher.id,
      summary: `Activated Teacher profile for ${existing.displayName}`,
    });

    return { type: "SUCCESS" as const, data: teacher };
  });
}
