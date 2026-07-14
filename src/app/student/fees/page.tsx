import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import {
  listStudentFeeDues,
  type StudentFeeDuesResult,
} from "@/server/services/fee-assignments";
import {
  StudentFeeStatus,
  type FeeAssignment,
} from "@/features/fees/components/StudentFeeStatus";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";

function toFeeAssignmentView(
  assignments: StudentFeeDuesResult["assignments"],
): FeeAssignment[] {
  return assignments.map((a) => ({
    id: a.id,
    feePlan: a.feePlan ? { name: a.feePlan.name } : null,
    enrolment: {
      batch: a.enrolment?.batch ? { name: a.enrolment.batch.name } : null,
      curriculumTrack: null,
    },
    dues: a.dues.map((d) => ({
      id: d.id,
      label: d.label,
      dueDate: d.dueDate,
      amountDue: d.amountDue.toString(),
      amountWaived: d.amountWaived.toString(),
      status: d.status,
    })),
  }));
}

export default async function StudentFeesPage() {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  const student = await db.student.findUnique({
    where: { id: appUser.studentId },
    include: { enrolments: { where: { status: "active", archivedAt: null } } },
  });

  if (!student || student.enrolments.length === 0) {
    return (
      <EmptyState
        icon={WalletCards}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  const actor = {
    userId: appUser.id,
    role: appUser.role as Role,
    metadata: {
      role: appUser.role as Role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };

  const result = await listStudentFeeDues(actor);
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={WalletCards}
        title="Error loading fees"
        description={result.error.message}
      />
    );
  }

  const { assignments } = result.data;

  const feeAssignments = toFeeAssignmentView(assignments);

  if (assignments.length === 0) {
    return (
      <EmptyState
        icon={WalletCards}
        title="No Fee Records"
        description="There are currently no fee records assigned to your enrolment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fees</h1>
        <p className="text-muted-foreground">Your fee plans, dues, and payment status.</p>
      </div>

      <StudentFeeStatus assignments={feeAssignments} />
    </div>
  );
}
