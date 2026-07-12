import { cn } from "@/lib/utils";

const dueStatusMeta: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  PARTIALLY_PAID: { label: "Partially Paid", className: "bg-orange-100 text-orange-800" },
  PAID: { label: "Paid", className: "bg-green-100 text-green-800" },
  WAIVED: { label: "Waived", className: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500" },
  OVERDUE: { label: "Overdue", className: "bg-red-100 text-red-800" },
};

function formatCurrency(value: number | string): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return `₹${n.toFixed(2)}`;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface FeeDue {
  id: string;
  label: string;
  dueDate: string | Date;
  amountDue: string;
  amountWaived: string;
  status: string;
}

export interface FeeAssignment {
  id: string;
  feePlan?: { name: string } | null;
  enrolment?: {
    batch?: { name: string } | null;
    curriculumTrack?: { subject?: { name: string } | null } | null;
  } | null;
  dues: FeeDue[];
}

export function StudentFeeStatus({ assignments }: { assignments: FeeAssignment[] }) {
  if (assignments.length === 0) return null;

  const pendingTotal = assignments
    .flatMap((a) => a.dues)
    .filter(
      (d) =>
        d.status === "PENDING" || d.status === "OVERDUE" || d.status === "PARTIALLY_PAID",
    )
    .reduce<number>(
      (sum, d) => sum + (parseFloat(d.amountDue) - parseFloat(d.amountWaived)),
      0,
    );

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-2xl border border-border/60 bg-surface-elevated p-5 sm:p-6 flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Pending Fees
        </p>
        <p className="text-3xl font-bold font-heading">{formatCurrency(pendingTotal)}</p>
        <p className="text-sm text-muted-foreground">
          Across {assignments.length} active fee{" "}
          {assignments.length === 1 ? "plan" : "plans"}
        </p>
      </div>

      {/* Assignment cards */}
      {assignments.map((a) => {
        const plannedTotal = a.dues
          .filter((d) => d.status !== "CANCELLED")
          .reduce<number>(
            (sum, d) => sum + (parseFloat(d.amountDue) - parseFloat(d.amountWaived)),
            0,
          );

        const settledTotal = a.dues
          .filter((d) => d.status === "PAID" || d.status === "WAIVED")
          .reduce<number>(
            (sum, d) => sum + (parseFloat(d.amountDue) - parseFloat(d.amountWaived)),
            0,
          );

        return (
          <div
            key={a.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-5 space-y-4"
          >
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-lg leading-tight">
                {a.feePlan?.name || "Fee Plan"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {a.enrolment?.batch?.name}
                {a.enrolment?.curriculumTrack?.subject?.name &&
                  ` · ${a.enrolment.curriculumTrack.subject.name}`}
              </p>
              <p className="text-xs text-muted-foreground">
                Plan total: {formatCurrency(plannedTotal)} · Settled:{" "}
                {formatCurrency(settledTotal)}
              </p>
            </div>

            <div className="space-y-2">
              {a.dues.map((due) => {
                const meta = dueStatusMeta[due.status] || dueStatusMeta.PENDING;
                return (
                  <div
                    key={due.id}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{due.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {formatDate(due.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold">
                        {formatCurrency(
                          parseFloat(due.amountDue) - parseFloat(due.amountWaived),
                        )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
