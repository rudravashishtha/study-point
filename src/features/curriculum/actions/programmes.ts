"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  createProgramme,
  updateProgramme,
  archiveProgramme,
  restoreProgramme,
} from "@/server/services/curriculum/programmes";
import {
  createProgrammeSchema,
  updateProgrammeSchema,
} from "@/lib/validation/curriculum";

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

export async function createProgrammeAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = createProgrammeSchema.parse(data);
    await createProgramme(actor, parsed);
    revalidatePath("/admin/curriculum/programmes");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateProgrammeAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = updateProgrammeSchema.parse(data);
    await updateProgramme(actor, id, parsed);
    revalidatePath("/admin/curriculum/programmes");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveProgrammeAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveProgramme(actor, id);
    revalidatePath("/admin/curriculum/programmes");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreProgrammeAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreProgramme(actor, id);
    revalidatePath("/admin/curriculum/programmes");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
