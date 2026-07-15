"use server";

import {
  createBatch,
  updateBatch,
  archiveBatch,
  restoreBatch,
  type CreateBatchInput,
  type UpdateBatchInput,
} from "@/server/services/batches";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError, type DomainErrorCode } from "@/lib/domain/errors";

export const createBatchAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/batches", "/", "/courses"],
      async (_actor, data: CreateBatchInput) => {
        const result = await createBatch(data);
        if (!result.success) {
          throw new DomainError(
            (result.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            result.error?.message || "Failed to create batch",
          );
        }
        return { success: true, data: result.data };
      },
    ),
  ),
);

export const updateBatchDetailsAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/batches", `/admin/batches/${id}`, "/", "/courses"],
      async (_actor, id: string, data: UpdateBatchInput) => {
        // We explicitly DO NOT send 'schedules' to ensure the updateBatch
        // service safely preserves existing schedules.
        const detailsOnly = { ...data };
        delete detailsOnly.schedules;

        const result = await updateBatch(id, detailsOnly);
        if (!result.success) {
          throw new DomainError(
            (result.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            result.error?.message || "Failed to update batch",
          );
        }
        return { success: true, data: result.data };
      },
    ),
  ),
);

export const archiveBatchAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/batches", `/admin/batches/${id}`, "/", "/courses"],
      async (_actor, id: string) => {
        const result = await archiveBatch(id);
        if (!result.success) {
          throw new DomainError(
            (result.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            result.error?.message || "Failed to archive batch",
          );
        }
        return { success: true, data: result.data };
      },
    ),
  ),
);

export const restoreBatchAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/batches", `/admin/batches/${id}`, "/", "/courses"],
      async (_actor, id: string) => {
        const result = await restoreBatch(id);
        if (!result.success) {
          throw new DomainError(
            (result.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            result.error?.message || "Failed to restore batch",
          );
        }
        return { success: true, data: result.data };
      },
    ),
  ),
);
