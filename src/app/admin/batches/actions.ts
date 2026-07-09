"use server";

import { revalidatePath } from "next/cache";
import {
  createBatch,
  updateBatch,
  archiveBatch,
  restoreBatch,
} from "@/server/services/batches";
import { requireAdmin } from "@/lib/auth/permissions";

export async function createBatchAction(data: any) {
  const actorUserId = await requireAdmin();
  const result = await createBatch({ ...data, actorUserId });

  if (result.success) {
    revalidatePath("/admin/batches");
  }
  return result;
}

export async function updateBatchDetailsAction(id: string, data: any) {
  const actorUserId = await requireAdmin();

  // We explicitly DO NOT send 'schedules' to ensure the updateBatch
  // service safely preserves existing schedules.
  const { schedules, ...detailsOnly } = data;

  const result = await updateBatch(id, { ...detailsOnly, actorUserId });

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
  }
  return result;
}

export async function archiveBatchAction(id: string) {
  await requireAdmin();
  const result = await archiveBatch(id);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
  }
  return result;
}

export async function restoreBatchAction(id: string) {
  await requireAdmin();
  const result = await restoreBatch(id);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
  }
  return result;
}
