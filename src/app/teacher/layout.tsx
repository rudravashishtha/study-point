import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { TeacherShell } from "@/components/layout/teacher-shell";
import { getSiteSettings } from "@/server/services/site-settings";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await requireRole(Role.TEACHER);

  if (!appUser.teacherId) {
    redirect("/unauthorized");
  }

  const [assignments, settingsResult] = await Promise.all([
    db.teacherAssignment.findMany({
      where: {
        teacherId: appUser.teacherId,
        archivedAt: null,
        batch: { archivedAt: null, isActive: true },
      },
      include: {
        batch: {
          select: {
            id: true,
            name: true,
            curriculumTrack: {
              select: {
                classLevel: true,
                subject: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    getSiteSettings(),
  ]);

  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point";

  const batches = assignments.map((a) => ({
    id: a.batch.id,
    name: a.batch.name,
    subjectName: a.batch.curriculumTrack.subject.name,
    classLevel: a.batch.curriculumTrack.classLevel,
  }));

  return <TeacherShell batches={batches} instituteName={instituteName}>{children}</TeacherShell>;
}
