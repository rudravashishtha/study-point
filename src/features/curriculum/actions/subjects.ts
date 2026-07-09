"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  createSubject,
  updateSubject,
  archiveSubject,
  restoreSubject,
} from "@/server/services/curriculum/subjects";
import { createSubjectSchema, updateSubjectSchema } from "@/lib/validation/curriculum";

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

export async function createSubjectAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = createSubjectSchema.parse(data);
    await createSubject(actor, parsed);
    revalidatePath("/admin/curriculum/subjects");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSubjectAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = updateSubjectSchema.parse(data);
    await updateSubject(actor, id, parsed);
    revalidatePath("/admin/curriculum/subjects");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveSubjectAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveSubject(actor, id);
    revalidatePath("/admin/curriculum/subjects");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreSubjectAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreSubject(actor, id);
    revalidatePath("/admin/curriculum/subjects");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
