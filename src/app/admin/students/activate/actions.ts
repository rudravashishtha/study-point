"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { inviteStudent } from "@/server/services/provisioning";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import { rateLimit } from "@/lib/rate-limit";

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

export async function inviteStudentAction(studentId: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const { success: inviteOk } = rateLimit(`invite:${actor.userId}`, 20, 60 * 60_000);
    if (!inviteOk) {
      return { success: false, error: "Too many invitations. Please try again later." };
    }
    await inviteStudent(actor, studentId);
    revalidatePath("/admin/students/activate");
    return { success: true, data: undefined };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}

export async function bulkInviteStudentsAction(ids: string[]): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const { success: inviteOk } = rateLimit(`invite:${actor.userId}`, 20, 60 * 60_000);
    if (!inviteOk) {
      return { success: false, error: "Too many invitations. Please try again later." };
    }
    let invited = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await inviteStudent(actor, id);
        invited += 1;
      } catch {
        failed += 1;
      }
    }
    revalidatePath("/admin/students/activate");
    if (failed > 0) {
      return {
        success: false,
        error: `Invited ${invited} of ${ids.length}; ${failed} failed.`,
      };
    }
    return { success: true, data: undefined };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
