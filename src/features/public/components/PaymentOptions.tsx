"use client";

import { ChevronDown } from "lucide-react";

export interface PublicPaymentPlan {
  id: string;
  name: string;
  totalAmount: number;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
  instalments: Array<{
    id: string;
    label: string;
    amount: number;
  }>;
}

const frequencyLabels: Record<PublicPaymentPlan["frequency"], string> = {
  MONTHLY: "Monthly plan",
  QUARTERLY: "Quarterly payment",
  YEARLY: "Annual payment",
  CUSTOM: "Easy instalments",
};

function formatAmount(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function planDescription(plan: PublicPaymentPlan) {
  if (plan.instalments.length === 1) {
    return `${formatAmount(plan.instalments[0].amount)} due at a time`;
  }

  if (plan.instalments.length > 1) {
    const smallestPayment = Math.min(...plan.instalments.map((instalment) => instalment.amount));
    return `${plan.instalments.length} payments from ${formatAmount(smallestPayment)}`;
  }

  return plan.frequency === "CUSTOM"
    ? "Payment schedule available on enquiry"
    : "Flexible payment option";
}

export function PaymentOptions({ plans }: { plans: PublicPaymentPlan[] }) {
  if (plans.length === 0) return null;

  const annualPlan = plans.find((plan) => plan.frequency === "YEARLY");
  const lowestTotal = Math.min(...plans.map((plan) => plan.totalAmount));
  const highestAmount = Math.max(...plans.map((plan) => plan.totalAmount));
  const annualSaving = annualPlan ? highestAmount - annualPlan.totalAmount : 0;
  const highestPricedPlan = plans.find((plan) => plan.totalAmount === highestAmount);

  const lowestScheduledPayment = plans
    .flatMap((plan) => plan.instalments.map((instalment) => instalment.amount))
    .sort((a, b) => a - b)[0];

  return (
    <div className="rounded-lg border border-primary/10 bg-primary/5 p-3">
      <p className="text-xs font-medium text-muted-foreground">
        {lowestScheduledPayment
          ? `Payments from ${formatAmount(lowestScheduledPayment)}`
          : "Flexible payment options available"}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        Choose how you&apos;d like to pay
      </p>

      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          View payment options
          <ChevronDown
            className="size-4 transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>
        <ul className="mt-2 space-y-2" aria-label="Payment options">
          {plans.map((plan) => {
            const isBestValue =
              plan.frequency === "YEARLY" &&
              plan.totalAmount === lowestTotal &&
              annualSaving > 0;

            return (
              <li
                key={plan.id}
                className="rounded-md border border-border/70 bg-background px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {frequencyLabels[plan.frequency]}
                      </p>
                      {isBestValue ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Best value
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {planDescription(plan)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold text-foreground">
                      {formatAmount(plan.totalAmount)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Total fee</p>
                  </div>
                </div>
                {isBestValue ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    Save {formatAmount(annualSaving)} compared with the {highestPricedPlan?.frequency === "MONTHLY" ? "monthly plan" : "highest-priced option"}.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}
