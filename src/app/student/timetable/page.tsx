import { redirect } from "next/navigation";
import { CalendarClock, BookOpen } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { getStudentTimetable } from "@/server/services/timetable";
import { getLiveClassSessionsForStudent } from "@/server/services/live-classes";
import { StudentTimetableGrid } from "@/features/timetable/components/StudentTimetableGrid";
import { AgendaView } from "@/features/live-classes/components/agenda-view";
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

  const [timetableResult, liveSessions] = await Promise.all([
    getStudentTimetable(actor),
    getLiveClassSessionsForStudent(appUser.studentId),
  ]);

  if (!timetableResult.success) {
    if (timetableResult.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={CalendarClock}
        title="Error loading timetable"
        description={timetableResult.error.message}
      />
    );
  }

  const { groups } = timetableResult.data;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Live Classes & Timetable</h1>
        <p className="text-muted-foreground">
          Your scheduled live sessions and weekly class schedule.
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

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Weekly Timetable</h2>
        {groups.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No Schedule"
            description="Your weekly timetable has not been published yet."
          />
        ) : (
          <div className="border rounded-md bg-card text-card-foreground shadow-sm">
            <StudentTimetableGrid groups={groups} />
          </div>
        )}
      </div>
    </div>
  );
}
