import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/permissions";
import { Role, FeeDueStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getSiteSettings } from "@/server/services/site-settings";
import { PrintReceiptButton } from "@/features/fees/components/PrintReceiptButton";
import { formatCurrency } from "@/features/fees/components/StudentFeeStatus";

export const dynamic = "force-dynamic";

const statusLabel: Record<FeeDueStatus, string> = {
  PENDING: "Pending",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  WAIVED: "Waived",
  CANCELLED: "Cancelled",
  OVERDUE: "Overdue",
};

export default async function StudentFeeReceiptPage({
  params,
}: {
  params: Promise<{ dueId: string }>;
}) {
  const { dueId } = await params;
  const user = await requireRole(Role.STUDENT);
  if (!user.studentId) notFound();

  const due = await db.studentFeeDue.findUnique({
    where: { id: dueId },
    include: {
      feeAssignment: {
        include: {
          feePlan: true,
          enrolment: {
            include: {
              student: true,
              batch: true,
              academicSession: true,
              curriculumTrack: true,
            },
          },
        },
      },
    },
  });

  if (!due) notFound();

  const enrolment = due.feeAssignment.enrolment;
  if (enrolment.studentId !== user.studentId) notFound();

  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point";
  const amountPaid = due.amountDue.toNumber() - due.amountWaived.toNumber();
  const status = due.status as FeeDueStatus;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/student/fees"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to fees
        </Link>
        <PrintReceiptButton />
      </div>

      <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <div className="border-b pb-4 text-center">
          <p className="text-lg font-semibold">{instituteName}</p>
          <p className="text-sm text-muted-foreground">Fee Receipt</p>
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Receipt for</dt>
            <dd className="font-medium">{enrolment.student.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Student code</dt>
            <dd className="font-medium">{enrolment.student.studentCode}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Session</dt>
            <dd className="font-medium">{enrolment.academicSession.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Class / Batch</dt>
            <dd className="font-medium">
              {enrolment.curriculumTrack.displayName}
              {enrolment.batch ? ` · ${enrolment.batch.name}` : ""}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Plan</dt>
            <dd className="font-medium">{due.feeAssignment.feePlan.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Installment</dt>
            <dd className="font-medium">{due.label}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Due date</dt>
            <dd className="font-medium">{due.dueDate.toLocaleDateString("en-IN")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Amount due</dt>
            <dd className="font-medium">{formatCurrency(due.amountDue.toNumber())}</dd>
          </div>
          {due.amountWaived.toNumber() > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Waived</dt>
              <dd className="font-medium">
                {formatCurrency(due.amountWaived.toNumber())}
              </dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Amount paid</dt>
            <dd>{formatCurrency(amountPaid)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="font-medium">{statusLabel[status]}</dd>
          </div>
        </dl>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This is a system-generated receipt. Generated on{" "}
          {new Date().toLocaleDateString("en-IN")}.
        </p>
      </div>
    </div>
  );
}
