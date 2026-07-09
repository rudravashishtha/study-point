"use server";

import { revalidatePath } from "next/cache";
import { ActorContext } from "@/lib/domain/actor";
import {
  createChapter,
  updateChapter,
  archiveChapter,
  restoreChapter,
  moveChapter,
} from "@/server/services/curriculum/chapters";
import {
  createTopic,
  updateTopic,
  archiveTopic,
  restoreTopic,
  moveTopic,
} from "@/server/services/curriculum/topics";
import {
  createChapterSchema,
  updateChapterSchema,
  createTopicSchema,
  updateTopicSchema,
} from "@/lib/validation/curriculum";

import { requireAdmin } from "@/lib/auth/permissions";

async function getActor(): Promise<ActorContext> {
  const appUser = await requireAdmin();
  return {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };
}

// ==========================================
// Chapters Actions
// ==========================================

import { db } from "@/lib/db";

export async function createChapterAction(trackId: string, data: unknown) {
  try {
    const actor = await getActor();
    const parsed = createChapterSchema.parse(data);

    if (parsed.curriculumTrackId !== trackId) {
      return { success: false, error: "Track ID mismatch." };
    }

    await createChapter(actor, parsed);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError")
      return { success: false, error: error.errors[0].message };
    return { success: false, error: error.message || "Failed to create chapter" };
  }
}

export async function updateChapterAction(
  trackId: string,
  chapterId: string,
  data: unknown,
) {
  try {
    const actor = await getActor();
    const parsed = updateChapterSchema.parse(data);

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, curriculumTrackId: trackId },
    });
    if (!chapter) return { success: false, error: "Chapter not found in this track." };

    await updateChapter(actor, chapterId, parsed);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError")
      return { success: false, error: error.errors[0].message };
    return { success: false, error: error.message || "Failed to update chapter" };
  }
}

export async function archiveChapterAction(trackId: string, chapterId: string) {
  try {
    const actor = await getActor();
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, curriculumTrackId: trackId },
    });
    if (!chapter) return { success: false, error: "Chapter not found in this track." };

    await archiveChapter(actor, chapterId);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive chapter" };
  }
}

export async function restoreChapterAction(trackId: string, chapterId: string) {
  try {
    const actor = await getActor();
    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, curriculumTrackId: trackId },
    });
    if (!chapter) return { success: false, error: "Chapter not found in this track." };

    await restoreChapter(actor, chapterId);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restore chapter" };
  }
}

export async function moveChapterAction(
  trackId: string,
  chapterId: string,
  direction: "UP" | "DOWN",
) {
  try {
    const actor = await getActor();
    // service already verifies trackId
    await moveChapter(actor, trackId, chapterId, direction);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to move chapter" };
  }
}

// ==========================================
// Topics Actions
// ==========================================

export async function createTopicAction(
  trackId: string,
  chapterId: string,
  data: unknown,
) {
  try {
    const actor = await getActor();
    const parsed = createTopicSchema.parse(data);

    if (parsed.chapterId !== chapterId) {
      return { success: false, error: "Chapter ID mismatch." };
    }

    const chapter = await db.chapter.findUnique({
      where: { id: chapterId, curriculumTrackId: trackId },
    });
    if (!chapter) return { success: false, error: "Chapter not found in this track." };

    await createTopic(actor, parsed);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError")
      return { success: false, error: error.errors[0].message };
    return { success: false, error: error.message || "Failed to create topic" };
  }
}

export async function updateTopicAction(
  trackId: string,
  chapterId: string,
  topicId: string,
  data: unknown,
) {
  try {
    const actor = await getActor();
    const parsed = updateTopicSchema.parse(data);

    const topic = await db.topic.findUnique({
      where: { id: topicId, chapterId: chapterId },
      include: { chapter: true },
    });
    if (!topic || topic.chapter.curriculumTrackId !== trackId)
      return { success: false, error: "NOT_FOUND" };

    await updateTopic(actor, topicId, parsed);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError")
      return { success: false, error: error.errors[0].message };
    return { success: false, error: error.message || "Failed to update topic" };
  }
}

export async function archiveTopicAction(
  trackId: string,
  chapterId: string,
  topicId: string,
) {
  try {
    const actor = await getActor();
    const topic = await db.topic.findUnique({
      where: { id: topicId, chapterId: chapterId },
      include: { chapter: true },
    });
    if (!topic || topic.chapter.curriculumTrackId !== trackId)
      return { success: false, error: "NOT_FOUND" };

    await archiveTopic(actor, topicId);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to archive topic" };
  }
}

export async function restoreTopicAction(
  trackId: string,
  chapterId: string,
  topicId: string,
) {
  try {
    const actor = await getActor();
    const topic = await db.topic.findUnique({
      where: { id: topicId, chapterId: chapterId },
      include: { chapter: true },
    });
    if (!topic || topic.chapter.curriculumTrackId !== trackId)
      return { success: false, error: "NOT_FOUND" };

    await restoreTopic(actor, topicId);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to restore topic" };
  }
}

export async function moveTopicAction(
  trackId: string,
  chapterId: string,
  topicId: string,
  direction: "UP" | "DOWN",
) {
  try {
    const actor = await getActor();
    // service already verifies trackId and chapterId
    await moveTopic(actor, trackId, chapterId, topicId, direction);
    revalidatePath(`/admin/curriculum/curriculum-tracks/${trackId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to move topic" };
  }
}
