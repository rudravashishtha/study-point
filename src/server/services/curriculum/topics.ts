import { db } from "../../../lib/db";
import { isConcurrencyConflict } from "../../../lib/db/errors";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { createAuditLog } from "../../../lib/domain/audit";
import { DomainError } from "../../../lib/domain/errors";

export async function listTopics(
  chapterId: string,
  params: { archiveState: "active" | "archived" | "all" },
) {
  const where: Prisma.TopicWhereInput = { chapterId };
  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  return await db.topic.findMany({
    where,
    orderBy: { displayOrder: "asc" },
  });
}

export async function createTopic(
  actor: ActorContext,
  data: { chapterId: string; name: string },
) {
  return await db.$transaction(async (tx) => {
    const chapter = await tx.chapter.findUnique({
      where: { id: data.chapterId },
    });
    if (!chapter) {
      throw new DomainError("NOT_FOUND", "Chapter not found.");
    }
    if (chapter.archivedAt) {
      throw new DomainError(
        "INVALID_LIFECYCLE",
        "Cannot create a topic in an archived chapter.",
      );
    }

    const lastTopic = await tx.topic.findFirst({
      where: { chapterId: data.chapterId },
      orderBy: { displayOrder: "desc" },
    });

    const newDisplayOrder = lastTopic ? lastTopic.displayOrder + 1 : 0;

    const topic = await tx.topic.create({
      data: {
        chapterId: data.chapterId,
        name: data.name,
        displayOrder: newDisplayOrder,
        createdBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "CREATE",
      entityType: "Topic",
      entityId: topic.id,
      summary: `Created topic: ${topic.name}`,
      metadata: { chapterId: data.chapterId, name: topic.name },
    });

    return topic;
  });
}

export async function updateTopic(
  actor: ActorContext,
  id: string,
  data: { name: string },
) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.topic.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Topic not found.");
    }
    if (existing.archivedAt) {
      throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived topic.");
    }

    if (existing.name === data.name) {
      return existing;
    }

    const topic = await tx.topic.update({
      where: { id },
      data: {
        name: data.name,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "UPDATE",
      entityType: "Topic",
      entityId: topic.id,
      summary: `Updated topic: ${existing.name}`,
      metadata: { previousValues: { name: existing.name } },
    });

    return topic;
  });
}

export async function archiveTopic(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.topic.findUnique({ where: { id } });
    if (!existing) throw new DomainError("NOT_FOUND", "Topic not found.");
    if (existing.archivedAt)
      throw new DomainError("INVALID_LIFECYCLE", "Topic is already archived.");

    const topic = await tx.topic.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "Topic",
      entityId: topic.id,
      summary: `Archived topic: ${topic.name}`,
    });

    return topic;
  });
}

export async function restoreTopic(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.topic.findUnique({ where: { id } });
    if (!existing) throw new DomainError("NOT_FOUND", "Topic not found.");
    if (!existing.archivedAt) return existing;

    const topic = await tx.topic.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "Topic",
      entityId: topic.id,
      summary: `Restored topic: ${topic.name}`,
    });

    return topic;
  });
}

export async function deleteTopic(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.topic.findUnique({ where: { id } });
    if (!existing) throw new DomainError("NOT_FOUND", "Topic not found.");
    if (!existing.archivedAt) {
      throw new DomainError(
        "INVALID_LIFECYCLE",
        "Only archived topics can be permanently deleted. Archive it first.",
      );
    }

    const dependencies = await collectTopicDependencies(tx, id);
    if (dependencies.length > 0) {
      throw new DomainError(
        "DEPENDENCY_EXISTS",
        `Cannot delete this topic because it still has: ${dependencies.join(", ")}. Remove or reassign them first.`,
      );
    }

    await tx.topic.delete({ where: { id } });

    await createAuditLog(tx, actor, {
      action: "DELETE",
      entityType: "Topic",
      entityId: existing.id,
      summary: `Permanently deleted topic: ${existing.name}`,
    });

    return { id };
  });
}

async function collectTopicDependencies(
  tx: Prisma.TransactionClient,
  topicId: string,
): Promise<string[]> {
  const deps: string[] = [];
  const questionCount = await tx.question.count({ where: { topicId } });
  if (questionCount > 0) deps.push(`${questionCount} question(s)`);
  const materialCount = await tx.studyMaterial.count({ where: { topicId } });
  if (materialCount > 0) deps.push(`${materialCount} study material(s)`);
  const homeworkCount = await tx.homework.count({ where: { topicId } });
  if (homeworkCount > 0) deps.push(`${homeworkCount} homework item(s)`);
  const testCount = await tx.test.count({ where: { topicId } });
  if (testCount > 0) deps.push(`${testCount} test(s)`);
  return deps;
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reorders a topic relative to its siblings
export async function moveTopic(
  actor: ActorContext,
  trackId: string,
  chapterId: string,
  topicId: string,
  direction: "UP" | "DOWN",
) {
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      return await db.$transaction(
        async (tx) => {
          const target = await tx.topic.findUnique({
            where: { id: topicId, chapterId: chapterId },
            include: { chapter: true },
          });

          if (!target)
            throw new DomainError("NOT_FOUND", "Topic not found in this chapter.");
          if (target.chapter.curriculumTrackId !== trackId)
            throw new DomainError(
              "NOT_FOUND",
              "Topic does not belong to the specified track.",
            );
          if (target.archivedAt)
            throw new DomainError("INVALID_LIFECYCLE", "Cannot move archived topic.");

          const allTopics = await tx.topic.findMany({
            where: { chapterId: chapterId, archivedAt: null },
            orderBy: { displayOrder: "asc" },
          });

          const currentIndex = allTopics.findIndex((t) => t.id === target.id);
          if (currentIndex === -1) {
            throw new DomainError(
              "INVALID_LIFECYCLE",
              "Target topic is not in active list.",
            );
          }

          let otherTopic = null;
          if (direction === "UP" && currentIndex > 0) {
            otherTopic = allTopics[currentIndex - 1];
          } else if (direction === "DOWN" && currentIndex < allTopics.length - 1) {
            otherTopic = allTopics[currentIndex + 1];
          }

          if (otherTopic) {
            await tx.topic.update({
              where: { id: target.id },
              data: { displayOrder: otherTopic.displayOrder },
            });
            await tx.topic.update({
              where: { id: otherTopic.id },
              data: { displayOrder: target.displayOrder },
            });

            await createAuditLog(tx, actor, {
              action: "REORDER",
              entityType: "Topic",
              entityId: target.id,
              summary: `Reordered topic: ${target.name} ${direction}`,
              metadata: {
                swappedWithId: otherTopic.id,
                previousOrder: target.displayOrder,
                newOrder: otherTopic.displayOrder,
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
