"use server";

import {
  createFeePlan,
  updateFeePlan,
  archiveFeePlan,
  restoreFeePlan,
} from "@/server/services/fees";
import { FeePlanCreateSchema, FeePlanUpdateSchema } from "@/lib/validation/fees";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/fees"],
      async (actor, data: unknown) => {
        const parsed = FeePlanCreateSchema.parse(data);
        await createFeePlan(actor, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);

export const updateFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string, data: unknown) => {
        const parsed = FeePlanUpdateSchema.parse(data);
        await updateFeePlan(actor, id, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);

export const archiveFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string) => {
        await archiveFeePlan(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);

export const restoreFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string) => {
        await restoreFeePlan(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);
