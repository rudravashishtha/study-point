"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import {
  createTest,
  updateTest,
  publishTest,
  archiveTest,
  CreateTestInput,
  UpdateTestInput,
} from "@/server/services/tests";
import { revalidatePath } from "next/cache";

export async function createAdminTestAction(input: CreateTestInput) {
  const admin = await requireAdmin();
  const res = await createTest(admin.id, input);
  if (res.success) {
    revalidatePath("/admin/tests");
  }
  return res;
}

export async function updateAdminTestAction(id: string, input: UpdateTestInput) {
  const admin = await requireAdmin();
  const res = await updateTest(admin.id, id, input);
  if (res.success) {
    revalidatePath("/admin/tests");
  }
  return res;
}

export async function publishAdminTestAction(id: string) {
  const admin = await requireAdmin();
  const res = await publishTest(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/tests");
  }
  return res;
}

export async function archiveAdminTestAction(id: string) {
  const admin = await requireAdmin();
  const res = await archiveTest(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/tests");
  }
  return res;
}
