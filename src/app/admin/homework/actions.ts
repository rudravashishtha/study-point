"use server";

import {
  createHomework,
  updateHomework,
  publishHomework,
  archiveHomework,
  CreateHomeworkInput,
  UpdateHomeworkInput,
} from "@/server/services/homework";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError, type DomainErrorCode } from "@/lib/domain/errors";

export const createAdminHomeworkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/homework"], async (actor, input: CreateHomeworkInput) => {
      const res = await createHomework(actor.userId, input);
      if (!res.success) {
        throw new DomainError(
          (res.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
          res.error?.message || "Failed to create homework",
        );
      }
      return { success: true, data: res.data };
    }),
  ),
);

export const updateAdminHomeworkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/homework"],
      async (actor, id: string, input: UpdateHomeworkInput) => {
        const res = await updateHomework(actor.userId, id, input);
        if (!res.success) {
          throw new DomainError(
            (res.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            res.error?.message || "Failed to update homework",
          );
        }
        return { success: true, data: res.data };
      },
    ),
  ),
);

export const publishAdminHomeworkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/homework"],
      async (actor, id: string) => {
        const res = await publishHomework(actor.userId, id);
        if (!res.success) {
          throw new DomainError(
            (res.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            res.error?.message || "Failed to publish homework",
          );
        }
        return { success: true, data: res.data };
      },
    ),
  ),
);

export const archiveAdminHomeworkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/homework"],
      async (actor, id: string) => {
        const res = await archiveHomework(actor.userId, id);
        if (!res.success) {
          throw new DomainError(
            (res.error?.code as DomainErrorCode) || "INTERNAL_ERROR",
            res.error?.message || "Failed to archive homework",
          );
        }
        return { success: true, data: res.data };
      },
    ),
  ),
);
