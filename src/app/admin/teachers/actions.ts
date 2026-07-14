"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import {
  createTeacher,
  updateTeacher,
  archiveTeacher,
  restoreTeacher,
  CreateTeacherParams,
  UpdateTeacherParams,
} from "@/server/services/teachers";
import { inviteTeacher } from "@/server/services/provisioning";
import { createTeacherSchema, updateTeacherSchema } from "@/lib/validation/teachers";
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

export async function createTeacherAction(data: CreateTeacherParams) {
  const actor = await getActor();

  const parsed = createTeacherSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const result = await createTeacher(actor, parsed.data);
    if (result.type !== "SUCCESS") {
      // Create teacher only returns SUCCESS in current signature, but handling anyway
      return { error: "Failed to create teacher" };
    }
    revalidatePath("/admin/teachers");
    revalidatePath("/");
    revalidatePath("/about");
    return { success: true, teacherId: result.data.id };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateTeacherAction(id: string, data: UpdateTeacherParams) {
  const actor = await getActor();

  const parsed = updateTeacherSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") };
  }

  try {
    const result = await updateTeacher(actor, id, parsed.data);

    if (result.type === "NOT_FOUND") {
      return { error: "Teacher not found" };
    }

    if (result.type === "INVALID_LIFECYCLE") {
      return { error: result.reason || "Invalid lifecycle state" };
    }

    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    revalidatePath("/");
    revalidatePath("/about");
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function archiveTeacherAction(id: string) {
  const actor = await getActor();
  try {
    const result = await archiveTeacher(actor, id);
    if (result.type === "ARCHIVE_BLOCKED") {
      return {
        error:
          "Cannot deactivate teacher with active batch assignments. Remove them from active batches first.",
      };
    }
    if (result.type === "INVALID_LIFECYCLE") {
      return { error: "Cannot deactivate this teacher" };
    }
    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    revalidatePath("/");
    revalidatePath("/about");
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function restoreTeacherAction(id: string) {
  const actor = await getActor();
  try {
    const result = await restoreTeacher(actor, id);
    if (result.type !== "SUCCESS") {
      return { error: "Cannot reactivate this teacher" };
    }
    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    revalidatePath("/");
    revalidatePath("/about");
    return { success: true };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function inviteTeacherAction(id: string): Promise<ActionResult> {
  try {
    const actor = await getActor();
    await inviteTeacher(actor, id);
    revalidatePath("/admin/teachers");
    revalidatePath(`/admin/teachers/${id}`);
    return { success: true, data: undefined };
  } catch (error: unknown) {
    return handleActionError(error);
  }
}
