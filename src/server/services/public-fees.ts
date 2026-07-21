import { Prisma } from "@prisma/client";

export type PublicFeePlanSummary = ReturnType<typeof toPublicFeePlanSummary>;

export const publicFeePlanWhere = {
  showPublicly: true,
  isActive: true,
  archivedAt: null,
} satisfies Prisma.FeePlanWhereInput;

export function toPublicFeePlanSummary(plan: {
  id: string;
  name: string;
  showPublicly: boolean;
  totalAmount: Prisma.Decimal | number;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  instalments?: Array<{
    id: string;
    label: string;
    amount: Prisma.Decimal | number;
  }>;
}) {
  return {
    id: plan.id,
    name: plan.name,
    showPublicly: plan.showPublicly,
    frequency: plan.frequency,
    totalAmount:
      typeof plan.totalAmount === "number"
        ? plan.totalAmount
        : plan.totalAmount.toNumber(),
    instalments: (plan.instalments ?? []).map((instalment) => ({
      id: instalment.id,
      label: instalment.label,
      amount:
        typeof instalment.amount === "number"
          ? instalment.amount
          : instalment.amount.toNumber(),
    })),
  };
}
