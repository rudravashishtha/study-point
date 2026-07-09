"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import {
  createHomework,
  updateHomework,
  publishHomework,
  archiveHomework,
  CreateHomeworkInput,
  UpdateHomeworkInput,
} from "@/server/services/homework";
import { revalidatePath } from "next/cache";

export async function createAdminHomeworkAction(input: CreateHomeworkInput) {
  const admin = await requireAdmin();
  const res = await createHomework(admin.id, input);
  if (res.success) {
    revalidatePath("/admin/homework");
  }
  return res;
}

export async function updateAdminHomeworkAction(id: string, input: UpdateHomeworkInput) {
  const admin = await requireAdmin();
  const res = await updateHomework(admin.id, id, input);
  if (res.success) {
    revalidatePath("/admin/homework");
  }
  return res;
}

export async function publishAdminHomeworkAction(id: string) {
  const admin = await requireAdmin();
  const res = await publishHomework(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/homework");
  }
  return res;
}

export async function archiveAdminHomeworkAction(id: string) {
  const admin = await requireAdmin();
  const res = await archiveHomework(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/homework");
  }
  return res;
}
