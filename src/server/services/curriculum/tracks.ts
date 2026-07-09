import { db } from "../../../lib/db";
import { Prisma, ClassLevel } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { extractPrismaConstraintName } from "../../../lib/db/errors";
import { DomainError } from "../../../lib/domain/errors";
import { validateCurriculumTrack } from "../../../lib/curriculum/validation";

export async function listTracks(params: {
  page: number;
  pageSize: number;
  archiveState: "active" | "archived" | "all";
  query: string;
  boardId?: string;
  programmeId?: string;
  subjectId?: string;
  classLevel?: ClassLevel;
  sortField: "createdAt" | "updatedAt" | "displayName";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.CurriculumTrackWhereInput = {};
  if (params.archiveState === "active") {
    where.archivedAt = null;
    where.board = { archivedAt: null };
    where.subject = { archivedAt: null };
    where.OR = [{ programmeId: null }, { programme: { archivedAt: null } }];
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.query) {
    where.displayName = { contains: params.query, mode: "insensitive" };
  }

  if (params.boardId) where.boardId = params.boardId;
  if (params.programmeId) where.programmeId = params.programmeId;
  if (params.subjectId) where.subjectId = params.subjectId;
  if (params.classLevel) where.classLevel = params.classLevel;

  const [data, total] = await Promise.all([
    db.curriculumTrack.findMany({
      where,
      include: {
        board: { select: { id: true, name: true, code: true, archivedAt: true } },
        programme: { select: { id: true, name: true, code: true, archivedAt: true } },
        subject: { select: { id: true, name: true, code: true, archivedAt: true } },
      },
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.curriculumTrack.count({ where }),
  ]);

  return { data, total };
}

export async function getTrackById(id: string) {
  const track = await db.curriculumTrack.findUnique({
    where: { id },
    include: {
      board: { select: { id: true, name: true, code: true, archivedAt: true } },
      programme: { select: { id: true, name: true, code: true, archivedAt: true } },
      subject: { select: { id: true, name: true, code: true, archivedAt: true } },
    },
  });
  if (!track) {
    throw new DomainError("NOT_FOUND", "Curriculum track not found.");
  }
  return track;
}

export async function createTrack(
  actor: ActorContext,
  data: {
    boardId: string;
    programmeId: string | null;
    classLevel: ClassLevel;
    subjectId: string;
    displayName: string;
  },
) {
  try {
    return await db.$transaction(async (tx) => {
      // Validations
      const board = await tx.board.findUnique({ where: { id: data.boardId } });
      if (!board) throw new DomainError("NOT_FOUND", "Board not found.");
      if (board.archivedAt) {
        throw new DomainError(
          "INVALID_LIFECYCLE",
          "Cannot create a track under an archived board.",
        );
      }

      let programme = null;
      if (data.programmeId) {
        programme = await tx.programme.findUnique({ where: { id: data.programmeId } });
        if (!programme) throw new DomainError("NOT_FOUND", "Programme not found.");
        if (programme.archivedAt) {
          throw new DomainError(
            "INVALID_LIFECYCLE",
            "Cannot create a track under an archived programme.",
          );
        }
        if (programme.boardId !== data.boardId) {
          throw new DomainError(
            "INVALID_RELATION",
            "Programme must belong to the selected board.",
          );
        }
      }

      const subject = await tx.subject.findUnique({ where: { id: data.subjectId } });
      if (!subject) throw new DomainError("NOT_FOUND", "Subject not found.");
      if (subject.archivedAt) {
        throw new DomainError(
          "INVALID_LIFECYCLE",
          "Cannot create a track with an archived subject.",
        );
      }

      const validation = validateCurriculumTrack({
        boardCode: board.code,
        programmeCode: programme?.code,
        classLevel: data.classLevel,
      });
      if (!validation.valid) {
        throw new DomainError("INVALID_RELATION", validation.error!);
      }

      const track = await tx.curriculumTrack.create({
        data: {
          boardId: data.boardId,
          programmeId: data.programmeId,
          classLevel: data.classLevel,
          subjectId: data.subjectId,
          displayName: data.displayName,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "CurriculumTrack",
        entityId: track.id,
        summary: `Created curriculum track: ${track.displayName}`,
        metadata: {
          boardId: data.boardId,
          programmeId: data.programmeId,
          classLevel: data.classLevel,
          subjectId: data.subjectId,
          displayName: data.displayName,
        },
      });

      return track;
    });
  } catch (error) {
    const constraint = extractPrismaConstraintName(error);
    if (
      constraint === "CurriculumTrack_board_class_subject_null_prog_key" ||
      constraint === "CurriculumTrack_board_prog_class_subject_key"
    ) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A curriculum track with this board, programme, class, and subject already exists.",
      );
    }
    throw error;
  }
}

export async function updateTrack(
  actor: ActorContext,
  id: string,
  data: { displayName: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.curriculumTrack.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Curriculum track not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived track.");
    }

    if (existing.displayName === data.displayName) {
      return existing;
    }

    const track = await tx.curriculumTrack.update({
      where: { id },
      data: {
        displayName: data.displayName,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "CurriculumTrack",
      entityId: track.id,
      summary: `Updated curriculum track: ${existing.displayName}`,
      metadata: {
        previousValues: { displayName: existing.displayName },
      },
    });

    return track;
  });
}

export async function archiveTrack(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.curriculumTrack.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Curriculum track not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Curriculum track is already archived.");
    }

    // Dependency Blocking
    const [activeChapters] = await Promise.all([
      tx.chapter.count({ where: { curriculumTrackId: id, archivedAt: null } }),
    ]);

    if (activeChapters > 0) {
      throw new DomainError(
        "ARCHIVE_BLOCKED",
        "Cannot archive curriculum track while it has active chapters.",
      );
    }

    const track = await tx.curriculumTrack.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "CurriculumTrack",
      entityId: track.id,
      summary: `Archived curriculum track: ${track.displayName}`,
    });

    return track;
  });
}

export async function restoreTrack(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.curriculumTrack.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Curriculum track not found.");
    }
    if (!existing.archivedAt) {
      // True no-op
      return existing;
    }

    // We explicitly allow independent restore even if parents are archived.
    // However, they will be filtered out of active selectors if parents remain archived.

    const track = await tx.curriculumTrack.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "CurriculumTrack",
      entityId: track.id,
      summary: `Restored curriculum track: ${track.displayName}`,
    });

    return track;
  });
}
