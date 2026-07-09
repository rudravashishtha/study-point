import { db } from "../../../lib/db";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { extractPrismaUniqueFields, matchUniqueFields } from "../../../lib/db/errors";
import { DomainError } from "../../../lib/domain/errors";

export async function listBoards(params: {
  page: number;
  pageSize: number;
  archiveState: "active" | "archived" | "all";
  query: string;
  sortField: "createdAt" | "updatedAt" | "name" | "code";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.BoardWhereInput = {};
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
    db.board.findMany({
      where,
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.board.count({ where }),
  ]);

  return { data, total };
}

export async function createBoard(
  actor: ActorContext,
  data: { code: string; name: string },
) {
  try {
    return await db.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          code: data.code,
          name: data.name,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "Board",
        entityId: board.id,
        summary: `Created board: ${board.code}`,
        metadata: { code: board.code, name: board.name },
      });

      return board;
    });
  } catch (error) {
    const uniqueFields = extractPrismaUniqueFields(error);
    if (matchUniqueFields(uniqueFields, ["code"])) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A board with this code already exists.",
      );
    }
    throw error;
  }
}

export async function updateBoard(
  actor: ActorContext,
  id: string,
  data: { name: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.board.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Board not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived board.");
    }

    if (existing.name === data.name) {
      return existing;
    }

    const board = await tx.board.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "Board",
      entityId: board.id,
      summary: `Updated board: ${existing.code}`,
      metadata: {
        previousValues: { name: existing.name },
      },
    });

    return board;
  });
}

export async function archiveBoard(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.board.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Board not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Board is already archived.");
    }

    // Dependency Blocking
    const [activeProgrammes, activeTracks] = await Promise.all([
      tx.programme.count({ where: { boardId: id, archivedAt: null } }),
      tx.curriculumTrack.count({ where: { boardId: id, archivedAt: null } }),
    ]);

    if (activeProgrammes > 0 || activeTracks > 0) {
      throw new DomainError(
        "ARCHIVE_BLOCKED",
        "Cannot archive board while it has active programmes or curriculum tracks.",
      );
    }

    const board = await tx.board.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "Board",
      entityId: board.id,
      summary: `Archived board: ${board.code}`,
    });

    return board;
  });
}

export async function restoreBoard(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.board.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Board not found.");
    }
    if (!existing.archivedAt) {
      // True no-op
      return existing;
    }

    const board = await tx.board.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "Board",
      entityId: board.id,
      summary: `Restored board: ${board.code}`,
    });

    return board;
  });
}
