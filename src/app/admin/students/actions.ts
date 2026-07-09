"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import {
  createStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  createStudentSchema,
  updateStudentSchema,
} from "@/server/services/students";

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

export async function createStudentAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = createStudentSchema.parse(data);
    await createStudent(parsed, actor.userId);
    revalidatePath("/admin/students");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateStudentAction(
  id: string,
  data: unknown,
): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = updateStudentSchema.parse({ id, ...(data as any) });
    await updateStudent(parsed, actor.userId);
    revalidatePath("/admin/students");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function archiveStudentAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await archiveStudent(id, actor.userId);
    revalidatePath("/admin/students");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function restoreStudentAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await restoreStudent(id, actor.userId);
    revalidatePath("/admin/students");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
