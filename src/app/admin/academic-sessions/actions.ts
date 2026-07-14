"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  activateSession,
  archiveSession,
  createSession,
  restoreSession,
  updateSession,
} from "@/server/services/academic-sessions";
import {
  SessionCreateSchema,
  SessionUpdateSchema,
} from "@/lib/validation/academic-sessions";

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

export async function createSessionAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = SessionCreateSchema.parse(data);
    await createSession(actor, parsed);
    revalidatePath("/admin/academic-sessions");
    revalidatePath("/");
    revalidatePath("/courses");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSessionAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = SessionUpdateSchema.parse(data);
    await updateSession(actor, id, parsed);
    revalidatePath("/admin/academic-sessions");
    revalidatePath("/");
    revalidatePath("/courses");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function activateSessionAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await activateSession(actor, id);
    revalidatePath("/admin/academic-sessions");
    revalidatePath("/");
    revalidatePath("/courses");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveSessionAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveSession(actor, id);
    revalidatePath("/admin/academic-sessions");
    revalidatePath("/");
    revalidatePath("/courses");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreSessionAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreSession(actor, id);
    revalidatePath("/admin/academic-sessions");
    revalidatePath("/");
    revalidatePath("/courses");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
