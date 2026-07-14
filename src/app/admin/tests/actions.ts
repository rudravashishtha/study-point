"use server";

import {
  createTest,
  updateTest,
  publishTest,
  archiveTest,
  CreateTestInput,
  UpdateTestInput,
} from "@/server/services/tests";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError } from "@/lib/domain/errors";

export const createAdminTestAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/tests"],
      async (actor, input: CreateTestInput) => {
        const res = await createTest(actor.userId, input);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to create test");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const updateAdminTestAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/tests"],
      async (actor, id: string, input: UpdateTestInput) => {
        const res = await updateTest(actor.userId, id, input);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to update test");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const publishAdminTestAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/tests"],
      async (actor, id: string) => {
        const res = await publishTest(actor.userId, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to publish test");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const archiveAdminTestAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/tests"],
      async (actor, id: string) => {
        const res = await archiveTest(actor.userId, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to archive test");
        }
        return { success: true, data: res.data };
      }
    )
  )
);
