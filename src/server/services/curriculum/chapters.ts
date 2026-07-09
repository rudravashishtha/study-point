import { db } from "../../../lib/db";
import { isConcurrencyConflict } from "../../../lib/db/errors";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { DomainError } from "../../../lib/domain/errors";

export async function listChapters(
  trackId: string,
  params: { archiveState: "active" | "archived" | "all" },
) {
  const where: Prisma.ChapterWhereInput = { curriculumTrackId: trackId };
  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  return await db.chapter.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });
}

export async function createChapter(
  actor: ActorContext,
  data: { curriculumTrackId: string; name: string },
) {
  return await db.$transaction(async (tx) => {
    const track = await tx.curriculumTrack.findUnique({
      where: { id: data.curriculumTrackId },
    });
    if (!track) {
      throw new DomainError("NOT_FOUND", "Curriculum track not found.");
    }
    if (track.archivedAt) {
      throw new DomainError(
        "INVALID_LIFECYCLE",
        "Cannot create a chapter in an archived track.",
      );
    }

    const lastChapter = await tx.chapter.findFirst({
      where: { curriculumTrackId: data.curriculumTrackId },
      orderBy: { displayOrder: "desc" },
    });

    const newDisplayOrder = lastChapter ? lastChapter.displayOrder + 1 : 0;

    const chapter = await tx.chapter.create({
      data: {
        curriculumTrackId: data.curriculumTrackId,
        name: data.name,
        displayOrder: newDisplayOrder,
        createdBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "CREATE",
      entityType: "Chapter",
      entityId: chapter.id,
      summary: `Created chapter: ${chapter.name}`,
      metadata: { curriculumTrackId: data.curriculumTrackId, name: chapter.name },
    });

    return chapter;
  });
}

export async function updateChapter(
  actor: ActorContext,
  id: string,
  data: { name: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.chapter.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Chapter not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived chapter.");
    }

    if (existing.name === data.name) {
      return existing;
    }

    const chapter = await tx.chapter.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "Chapter",
      entityId: chapter.id,
      summary: `Updated chapter: ${existing.name}`,
      metadata: { previousValues: { name: existing.name } },
    });

    return chapter;
  });
}

export async function archiveChapter(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.chapter.findUnique({ where: { id } });
    if (!existing) throw new DomainError("NOT_FOUND", "Chapter not found.");
    if (existing.archivedAt)
      throw new DomainError("INVALID_LIFECYCLE", "Chapter is already archived.");

    const topicsCount = await tx.topic.count({
      where: { chapterId: id, archivedAt: null },
    });
    if (topicsCount > 0) {
      throw new DomainError(
        "ARCHIVE_BLOCKED",
        "Cannot archive a chapter with active topics.",
      );
    }

    const chapter = await tx.chapter.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "Chapter",
      entityId: chapter.id,
      summary: `Archived chapter: ${chapter.name}`,
    });

    return chapter;
  });
}

export async function restoreChapter(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.chapter.findUnique({ where: { id } });
    if (!existing) throw new DomainError("NOT_FOUND", "Chapter not found.");
    if (!existing.archivedAt) return existing;

    const chapter = await tx.chapter.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "Chapter",
      entityId: chapter.id,
      summary: `Restored chapter: ${chapter.name}`,
    });

    return chapter;
  });
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reorders a chapter relative to its siblings
export async function moveChapter(
  actor: ActorContext,
  trackId: string,
  chapterId: string,
  direction: "UP" | "DOWN",
) {
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      return await db.$transaction(
        async (tx) => {
          const target = await tx.chapter.findUnique({
            where: { id: chapterId, curriculumTrackId: trackId },
          });
          if (!target)
            throw new DomainError("NOT_FOUND", "Chapter not found in this track.");
          if (target.archivedAt)
            throw new DomainError("INVALID_LIFECYCLE", "Cannot move archived chapter.");

          const allChapters = await tx.chapter.findMany({
            where: { curriculumTrackId: trackId, archivedAt: null },
            orderBy: { displayOrder: "asc" },
          });

          const currentIndex = allChapters.findIndex((c) => c.id === target.id);
          if (currentIndex === -1) {
            throw new DomainError(
              "INVALID_LIFECYCLE",
              "Target chapter is not in active list.",
            );
          }

          let otherChapter = null;
          if (direction === "UP" && currentIndex > 0) {
            otherChapter = allChapters[currentIndex - 1];
          } else if (direction === "DOWN" && currentIndex < allChapters.length - 1) {
            otherChapter = allChapters[currentIndex + 1];
          }

          if (otherChapter) {
            await tx.chapter.update({
              where: { id: target.id },
              data: { displayOrder: otherChapter.displayOrder },
            });
            await tx.chapter.update({
              where: { id: otherChapter.id },
              data: { displayOrder: target.displayOrder },
            });

            await createAuditLog(tx, actor, {
              action: "REORDER",
              entityType: "Chapter",
              entityId: target.id,
              summary: `Reordered chapter: ${target.name} ${direction}`,
              metadata: {
                swappedWithId: otherChapter.id,
                previousOrder: target.displayOrder,
                newOrder: otherChapter.displayOrder,
              },
            });
          }

          return true;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isConcurrencyConflict(error)) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw new DomainError(
            "CONCURRENT_UPDATE",
            "Failed to reorder due to concurrent modifications. Please try again.",
          );
        }
        const backoffMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
        await delay(backoffMs);
        continue;
      }
      throw error;
    }
  }
  throw new DomainError(
    "CONCURRENT_UPDATE",
    "Failed to reorder due to concurrent modifications.",
  );
}
