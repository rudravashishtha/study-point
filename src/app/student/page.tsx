import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getStudentDashboard } from "@/server/services/student-dashboard";
import { getLiveClassSessionsForStudent } from "@/server/services/live-classes";
import { StudentDashboard } from "@/features/dashboard/components/StudentDashboard";
import { AgendaView } from "@/features/live-classes/components/agenda-view";
import { EmptyState } from "@/components/feedback/empty-state";
import { Megaphone, BookOpen } from "lucide-react";
import { startOfDay } from "date-fns";

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

  const today = startOfDay(new Date());
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const liveSessions = await getLiveClassSessionsForStudent(appUser.studentId, {
    from: today,
    to: nextWeek,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Your upcoming classes, homework, tests, and notices.
        </p>
      </div>

      {liveSessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="size-5" /> Upcoming Live Classes
          </h2>
          <AgendaView sessions={liveSessions} role="STUDENT" />
        </div>
      )}

      <StudentDashboard data={result.data} />
    </div>
  );
}
