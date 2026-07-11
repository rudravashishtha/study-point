"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  createFeePlan,
  updateFeePlan,
  archiveFeePlan,
  restoreFeePlan,
} from "@/server/services/fees";
import { FeePlanCreateSchema, FeePlanUpdateSchema } from "@/lib/validation/fees";
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

export async function createFeePlanAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = FeePlanCreateSchema.parse(data);
    await createFeePlan(actor, parsed);
    revalidatePath("/admin/fees");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateFeePlanAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = FeePlanUpdateSchema.parse(data);
    await updateFeePlan(actor, id, parsed);
    revalidatePath("/admin/fees");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveFeePlanAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveFeePlan(actor, id);
    revalidatePath("/admin/fees");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreFeePlanAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreFeePlan(actor, id);
    revalidatePath("/admin/fees");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
