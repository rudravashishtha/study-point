"use server";

import {
  createFeePlan,
  updateFeePlan,
  archiveFeePlan,
  restoreFeePlan,
  getFeePlanById,
} from "@/server/services/fees";
import { FeePlanCreateSchema, FeePlanUpdateSchema } from "@/lib/validation/fees";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/fees"], async (actor, data: unknown) => {
      const parsed = FeePlanCreateSchema.parse(data);
      await createFeePlan(actor, parsed);
      return { success: true, data: undefined };
    }),
  ),
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
      },
    ),
  ),
);

export const archiveFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string) => {
        await archiveFeePlan(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const restoreFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string) => {
        await restoreFeePlan(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const duplicateFeePlanAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/fees"],
      async (actor, id: string) => {
        const plan = await getFeePlanById(id);
        if (!plan) return { success: false, error: "Fee plan not found" } as const;
        const data = {
          academicSessionId: plan.academicSessionId,
          curriculumTrackId: plan.curriculumTrackId,
          batchId: plan.batchId,
          name: `${plan.name} (Copy)`,
          description: plan.description,
          totalAmount: Number(plan.totalAmount),
          frequency: plan.frequency,
          showPublicly: plan.showPublicly,
          instalments: plan.instalments.map((inst, i) => ({
            label: inst.label,
            dueOffsetDays: inst.dueOffsetDays,
            dueDate: inst.dueDate ? inst.dueDate.toISOString().split("T")[0] : null,
            amount: Number(inst.amount),
            displayOrder: i,
          })),
        };
        await createFeePlan(actor, data);
        return { success: true, data: undefined };
      },
    ),
  ),
);
