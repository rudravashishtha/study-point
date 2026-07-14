"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
} from "@/server/services/announcements";
import {
  AnnouncementCreateSchema,
  AnnouncementUpdateSchema,
} from "@/lib/validation/announcements";
import { revalidatePath } from "next/cache";

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

export async function createAnnouncementAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = AnnouncementCreateSchema.parse(data);
    await createAnnouncement(actor, parsed);
    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateAnnouncementAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = AnnouncementUpdateSchema.parse(data);
    await updateAnnouncement(actor, id, parsed);
    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function publishAnnouncementAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await publishAnnouncement(actor, id);
    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveAnnouncementAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveAnnouncement(actor, id);
    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreAnnouncementAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreAnnouncement(actor, id);
    revalidatePath("/admin/announcements");
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
