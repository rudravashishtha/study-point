import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getStudentDashboard } from "@/server/services/student-dashboard";
import { StudentDashboard } from "@/features/dashboard/components/StudentDashboard";
import { EmptyState } from "@/components/feedback/empty-state";
import { Megaphone } from "lucide-react";

export default async function StudentDashboardPage() {
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
        icon={Megaphone}
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

  const result = await getStudentDashboard(actor);
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={Megaphone}
        title="Error loading dashboard"
        description={result.error.message}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your upcoming classes, homework, tests, and notices.
        </p>
      </div>

      <StudentDashboard data={result.data} />
    </div>
  );
}
