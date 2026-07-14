import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { getStudentCourseData } from "@/server/services/student-course";
import { StudentCourseView } from "@/features/dashboard/components/StudentCourseView";
import { EmptyState } from "@/components/feedback/empty-state";
import { BookOpen } from "lucide-react";

export default async function StudentCoursePage() {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  const result = await getStudentCourseData(appUser.studentId);

  if (!result.success) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Error loading course"
        description={result.error.message}
      />
    );
  }

  if (result.data.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Course &amp; Batch</h1>
        <p className="text-muted-foreground">
          Your class, batch, schedule, and teacher information.
        </p>
      </div>
      <StudentCourseView enrolments={result.data} />
    </div>
  );
}
