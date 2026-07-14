import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { getStudentTimetable } from "@/server/services/timetable";
import { StudentTimetableGrid } from "@/features/timetable/components/StudentTimetableGrid";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";

export default async function StudentTimetablePage() {
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
        icon={CalendarClock}
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

  const result = await getStudentTimetable(actor);
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={CalendarClock}
        title="Error loading timetable"
        description={result.error.message}
      />
    );
  }

  const { groups } = result.data;

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={CalendarClock}
        title="No Schedule"
        description="Your timetable has not been published yet. Check back later."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
        <p className="text-muted-foreground">Your weekly class schedule.</p>
      </div>

      <div className="border rounded-md bg-card text-card-foreground shadow-sm">
        <StudentTimetableGrid groups={groups} />
      </div>
    </div>
  );
}
