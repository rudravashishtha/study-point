import { db } from "../../../lib/db";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { extractPrismaUniqueFields, matchUniqueFields } from "../../../lib/db/errors";
import { DomainError } from "../../../lib/domain/errors";

export async function listSubjects(params: {
  page: number;
  pageSize: number;
  archiveState: "active" | "archived" | "all";
  query: string;
  sortField: "createdAt" | "updatedAt" | "name" | "code";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.SubjectWhereInput = {};
  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.query) {
    where.OR = [
      { name: { contains: params.query, mode: "insensitive" } },
      { code: { contains: params.query, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    db.subject.findMany({
      where,
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.subject.count({ where }),
  ]);

  return { data, total };
}

export async function createSubject(
  actor: ActorContext,
  data: { code: string; name: string },
) {
  try {
    return await db.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          code: data.code,
          name: data.name,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "Subject",
        entityId: subject.id,
        summary: `Created subject: ${subject.code}`,
        metadata: { code: subject.code, name: subject.name },
      });

      return subject;
    });
  } catch (error) {
    const uniqueFields = extractPrismaUniqueFields(error);
    if (matchUniqueFields(uniqueFields, ["code"])) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A subject with this code already exists.",
      );
    }
    throw error;
  }
}

export async function updateSubject(
  actor: ActorContext,
  id: string,
  data: { name: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Subject not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived subject.");
    }

    if (existing.name === data.name) {
      return existing;
    }

    const subject = await tx.subject.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "Subject",
      entityId: subject.id,
      summary: `Updated subject: ${existing.code}`,
      metadata: {
        previousValues: { name: existing.name },
      },
    });

    return subject;
  });
}

export async function archiveSubject(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Subject not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Subject is already archived.");
    }

    // Dependency Blocking
    const activeTracks = await tx.curriculumTrack.count({
      where: { subjectId: id, archivedAt: null },
    });

    if (activeTracks > 0) {
      throw new DomainError(
        "ARCHIVE_BLOCKED",
        "Cannot archive subject while it is used in active curriculum tracks.",
      );
    }

    const subject = await tx.subject.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "Subject",
      entityId: subject.id,
      summary: `Archived subject: ${subject.code}`,
    });

    return subject;
  });
}

export async function restoreSubject(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Subject not found.");
    }
    if (!existing.archivedAt) {
      // True no-op
      return existing;
    }

    const subject = await tx.subject.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "Subject",
      entityId: subject.id,
      summary: `Restored subject: ${subject.code}`,
    });

    return subject;
  });
}
