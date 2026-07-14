"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import type { ActionResult } from "@/lib/actions/types";
import { handleActionError } from "@/lib/actions/errors";
import {
  createBoard,
  updateBoard,
  archiveBoard,
  restoreBoard,
} from "@/server/services/curriculum/boards";
import { createBoardSchema, updateBoardSchema } from "@/lib/validation/curriculum";

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

export async function createBoardAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = createBoardSchema.parse(data);
    await createBoard(actor, parsed);
    revalidatePath("/admin/curriculum/boards");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateBoardAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = updateBoardSchema.parse(data);
    await updateBoard(actor, id, parsed);
    revalidatePath("/admin/curriculum/boards");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveBoardAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveBoard(actor, id);
    revalidatePath("/admin/curriculum/boards");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreBoardAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreBoard(actor, id);
    revalidatePath("/admin/curriculum/boards");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
