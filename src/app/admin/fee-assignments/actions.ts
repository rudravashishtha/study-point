"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  previewFeeAssignment,
  confirmFeeAssignment,
  archiveFeeAssignment,
  restoreFeeAssignment,
  FeeAssignmentTargetInput,
  PreviewFeeAssignmentResult,
  ConfirmFeeAssignmentResult,
} from "@/server/services/fee-assignments";
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

export async function previewFeeAssignmentAction(
  data: FeeAssignmentTargetInput,
): Promise<ActionResult<PreviewFeeAssignmentResult>> {
  try {
    const actor = await getActor();
    const res = await previewFeeAssignment(actor, data);
    if (!res.success) return { success: false, error: res.error.message };
    return { success: true, data: res.data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function confirmFeeAssignmentAction(
  data: FeeAssignmentTargetInput,
): Promise<ActionResult<ConfirmFeeAssignmentResult>> {
  try {
    const actor = await getActor();
    const res = await confirmFeeAssignment(actor, data);
    if (!res.success) return { success: false, error: res.error.message };
    revalidatePath("/admin/fee-assignments");
    return { success: true, data: res.data };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveFeeAssignmentAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const res = await archiveFeeAssignment(actor, id);
    if (!res.success) return { success: false, error: res.error.message };
    revalidatePath("/admin/fee-assignments");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreFeeAssignmentAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const res = await restoreFeeAssignment(actor, id);
    if (!res.success) return { success: false, error: res.error.message };
    revalidatePath("/admin/fee-assignments");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
