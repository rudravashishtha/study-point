import { redirect } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { listStudentHomework } from "@/server/services/homework";
import { StudentHomeworkList } from "@/features/homework/components/StudentHomeworkList";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";

export default async function StudentHomeworkPage() {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  // Check if the student has any active enrolments
  const student = await db.student.findUnique({
    where: { id: appUser.studentId },
    include: { enrolments: { where: { status: "ACTIVE", archivedAt: null } } },
  });

  if (!student || student.enrolments.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  const homeworkResult = await listStudentHomework(appUser.id);
  if (!homeworkResult.success) {
    if (homeworkResult.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="Error loading homework"
        description={homeworkResult.error.message}
      />
    );
  }

  const homework = homeworkResult.data.items;

  if (homework.length === 0) {
    return (
      <EmptyState
        icon={ClipboardCheck}
        title="No Homework"
        description="There is currently no published homework for your courses."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
        <p className="text-muted-foreground">
          Published homework for your active courses.
        </p>
      </div>

      <div className="border rounded-md bg-card text-card-foreground shadow-sm">
        <StudentHomeworkList homework={homework} />
      </div>
    </div>
  );
}
