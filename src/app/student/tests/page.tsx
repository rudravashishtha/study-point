import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { listStudentTests } from "@/server/services/tests";
import { StudentTestList } from "@/features/tests/components/StudentTestList";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";

export default async function StudentTestsPage() {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  const student = await db.student.findUnique({
    where: { id: appUser.studentId },
    include: { enrolments: { where: { status: "ACTIVE", archivedAt: null } } },
  });

  if (!student || student.enrolments.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  const testsResult = await listStudentTests(appUser.id);
  if (!testsResult.success) {
    if (testsResult.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={FileText}
        title="Error loading tests"
        description={testsResult.error.message}
      />
    );
  }

  const tests = testsResult.data.items;

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No Tests"
        description="There are currently no published tests for your courses."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tests</h1>
        <p className="text-muted-foreground">Published tests for your active courses.</p>
      </div>

      <div className="border rounded-md bg-card text-card-foreground shadow-sm">
        <StudentTestList tests={tests} />
      </div>
    </div>
  );
}
