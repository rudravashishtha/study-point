import { db } from "../../../lib/db";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { extractPrismaUniqueFields, matchUniqueFields } from "../../../lib/db/errors";
import { DomainError } from "../../../lib/domain/errors";

export async function listProgrammes(params: {
  page: number;
  pageSize: number;
  archiveState: "active" | "archived" | "all";
  query: string;
  boardId?: string;
  sortField: "createdAt" | "updatedAt" | "name" | "code";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.ProgrammeWhereInput = {};
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

  if (params.boardId) {
    where.boardId = params.boardId;
  }

  const [data, total] = await Promise.all([
    db.programme.findMany({
      where,
      include: {
        board: {
          select: { id: true, name: true, code: true, archivedAt: true },
        },
      },
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.programme.count({ where }),
  ]);

  return { data, total };
}

export async function createProgramme(
  actor: ActorContext,
  data: { boardId: string; code: string; name: string },
) {
  try {
    return await db.$transaction(async (tx) => {
      // Board must exist and be unarchived
      const board = await tx.board.findUnique({ where: { id: data.boardId } });
      if (!board) {
        throw new DomainError("NOT_FOUND", "Board not found.");
      }
      if (board.archivedAt) {
        throw new DomainError(
          "INVALID_LIFECYCLE",
          "Cannot create a programme under an archived board.",
        );
      }

      const programme = await tx.programme.create({
        data: {
          boardId: data.boardId,
          code: data.code,
          name: data.name,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "Programme",
        entityId: programme.id,
        summary: `Created programme: ${programme.code}`,
        metadata: { boardId: data.boardId, code: programme.code, name: programme.name },
      });

      return programme;
    });
  } catch (error) {
    const uniqueFields = extractPrismaUniqueFields(error);
    if (matchUniqueFields(uniqueFields, ["boardId", "code"])) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A programme with this code already exists under this board.",
      );
    }
    throw error;
  }
}

export async function updateProgramme(
  actor: ActorContext,
  id: string,
  data: { name: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.programme.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Programme not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived programme.");
    }

    if (existing.name === data.name) {
      return existing;
    }

    const programme = await tx.programme.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "Programme",
      entityId: programme.id,
      summary: `Updated programme: ${existing.code}`,
      metadata: {
        previousValues: { name: existing.name },
      },
    });

    return programme;
  });
}

export async function archiveProgramme(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.programme.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Programme not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Programme is already archived.");
    }

    // Dependency Blocking
    const activeTracks = await tx.curriculumTrack.count({
      where: { programmeId: id, archivedAt: null },
    });

    if (activeTracks > 0) {
      throw new DomainError(
        "ARCHIVE_BLOCKED",
        "Cannot archive programme while it has active curriculum tracks.",
      );
    }

    const programme = await tx.programme.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "Programme",
      entityId: programme.id,
      summary: `Archived programme: ${programme.code}`,
    });

    return programme;
  });
}

export async function restoreProgramme(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.programme.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Programme not found.");
    }
    if (!existing.archivedAt) {
      // True no-op
      return existing;
    }

    const programme = await tx.programme.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "Programme",
      entityId: programme.id,
      summary: `Restored programme: ${programme.code}`,
    });

    return programme;
  });
}
