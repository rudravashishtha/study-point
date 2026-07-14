"use server";

import { revalidatePath } from "next/cache";
import {
  createBatch,
  updateBatch,
  archiveBatch,
  restoreBatch,
  type CreateBatchInput,
  type UpdateBatchInput,
} from "@/server/services/batches";
import { requireAdmin } from "@/lib/auth/permissions";

export async function createBatchAction(data: CreateBatchInput) {
  await requireAdmin();
  const result = await createBatch(data);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath("/");
    revalidatePath("/courses");
  }
  return result;
}

export async function updateBatchDetailsAction(id: string, data: UpdateBatchInput) {
  await requireAdmin();

  // We explicitly DO NOT send 'schedules' to ensure the updateBatch
  // service safely preserves existing schedules.
  const detailsOnly = { ...data };
  delete detailsOnly.schedules;

  const result = await updateBatch(id, detailsOnly);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
    revalidatePath("/");
    revalidatePath("/courses");
  }
  return result;
}

export async function archiveBatchAction(id: string) {
  await requireAdmin();
  const result = await archiveBatch(id);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
    revalidatePath("/");
    revalidatePath("/courses");
  }
  return result;
}

export async function restoreBatchAction(id: string) {
  await requireAdmin();
  const result = await restoreBatch(id);

  if (result.success) {
    revalidatePath("/admin/batches");
    revalidatePath(`/admin/batches/${id}`);
    revalidatePath("/");
    revalidatePath("/courses");
  }
  return result;
}
