import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { listStudentMaterials } from "@/server/services/study-materials";
import { StudentMaterialList } from "@/features/materials/components/StudentMaterialList";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";

export default async function StudentCoursePage() {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  // Fetch student materials server-side
  const materialsResult = await listStudentMaterials(appUser.id);
  if (!materialsResult.success) {
    if (materialsResult.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={BookOpen}
        title="Error loading materials"
        description={materialsResult.error.message}
      />
    );
  }

  const materials = materialsResult.data;

  // We need to pass chapters to the UI so it can display chapter names if needed,
  // or the backend can include it. listStudentMaterials doesn't include chapters.
  // We'll fetch all active chapters.
  const activeChapters = await db.chapter.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });

  // Similarly topics
  const activeTopics = await db.topic.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });

  if (materials.length === 0) {
    // Check if the student has any active enrolments to determine empty state message
    const student = await db.student.findUnique({
      where: { id: appUser.studentId },
      include: { enrolments: { where: { status: "ACTIVE", archivedAt: null } } },
    });

    if (!student || student.enrolments.length === 0) {
      return (
        <EmptyState
          icon={BookOpen}
          title="No Active Courses"
          description="You are not currently enrolled in any active courses."
        />
      );
    }

    return (
      <EmptyState
        icon={BookOpen}
        title="No Materials Yet"
        description="There are currently no study materials published for your courses."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Study Materials</h1>
        <p className="text-muted-foreground">
          Resources, notes, and links for your active courses.
        </p>
      </div>

      <div className="border rounded-md p-6 bg-card text-card-foreground shadow-sm">
        <StudentMaterialList
          materials={materials}
          chapters={activeChapters}
          topics={activeTopics}
        />
      </div>
    </div>
  );
}
