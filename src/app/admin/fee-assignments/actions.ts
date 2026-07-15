"use server";

import {
  previewFeeAssignment,
  confirmFeeAssignment,
  archiveFeeAssignment,
  restoreFeeAssignment,
  FeeAssignmentTargetInput,
} from "@/server/services/fee-assignments";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError, type DomainErrorCode } from "@/lib/domain/errors";

export const previewFeeAssignmentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      [],
      async (actor, data: FeeAssignmentTargetInput) => {
        const res = await previewFeeAssignment(actor, data);
        if (!res.success) {
          throw new DomainError((res.error?.code as DomainErrorCode) || "INTERNAL_ERROR", res.error?.message || "Failed to preview");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const confirmFeeAssignmentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/fee-assignments"],
      async (actor, data: FeeAssignmentTargetInput) => {
        const res = await confirmFeeAssignment(actor, data);
        if (!res.success) {
          throw new DomainError((res.error?.code as DomainErrorCode) || "INTERNAL_ERROR", res.error?.message || "Failed to confirm");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const archiveFeeAssignmentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fee-assignments"],
      async (actor, id: string) => {
        const res = await archiveFeeAssignment(actor, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as DomainErrorCode) || "INTERNAL_ERROR", res.error?.message || "Failed to archive");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const restoreFeeAssignmentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fee-assignments"],
      async (actor, id: string) => {
        const res = await restoreFeeAssignment(actor, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as DomainErrorCode) || "INTERNAL_ERROR", res.error?.message || "Failed to restore");
        }
        return { success: true, data: res.data };
      }
    )
  )
);
