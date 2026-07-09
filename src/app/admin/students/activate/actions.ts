"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { inviteStudent } from "@/server/services/provisioning";
import { ActionResult, handleActionError } from "@/lib/actions/types";

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
    await inviteStudent(actor, studentId);
    revalidatePath("/admin/students/activate");
    return { success: true, data: undefined };
  } catch (error: any) {
    return handleActionError(error);
  }
}
