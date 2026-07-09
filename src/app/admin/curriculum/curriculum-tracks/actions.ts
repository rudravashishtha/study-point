"use server";

import { revalidatePath } from "next/cache";
import { ActorContext } from "@/lib/domain/actor";
import {
  createTrack,
  updateTrack,
  archiveTrack,
  restoreTrack,
} from "@/server/services/curriculum/tracks";
import {
  createCurriculumTrackSchema,
  updateCurriculumTrackSchema,
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

export async function createTrackAction(data: unknown) {
  try {
    const actor = await getActor();
    const parsed = createCurriculumTrackSchema.parse(data);

    await createTrack(actor, {
      ...parsed,
      programmeId: parsed.programmeId ?? null,
    });

    revalidatePath("/admin/curriculum/curriculum-tracks");
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return {
      success: false,
      error: error.message || "Failed to create curriculum track",
    };
  }
}

export async function updateTrackAction(id: string, data: unknown) {
  try {
    const actor = await getActor();
    const parsed = updateCurriculumTrackSchema.parse(data);

    await updateTrack(actor, id, parsed);

    revalidatePath("/admin/curriculum/curriculum-tracks");
    return { success: true };
  } catch (error: any) {
    if (error.name === "ZodError") {
      return { success: false, error: error.errors[0].message };
    }
    return {
      success: false,
      error: error.message || "Failed to update curriculum track",
    };
  }
}

export async function archiveTrackAction(id: string) {
  try {
    const actor = await getActor();
    await archiveTrack(actor, id);

    revalidatePath("/admin/curriculum/curriculum-tracks");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to archive curriculum track",
    };
  }
}

export async function restoreTrackAction(id: string) {
  try {
    const actor = await getActor();
    await restoreTrack(actor, id);

    revalidatePath("/admin/curriculum/curriculum-tracks");
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to restore curriculum track",
    };
  }
}
