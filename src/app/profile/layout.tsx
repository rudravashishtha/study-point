import { requireAppUser } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { TeacherShell } from "@/components/layout/teacher-shell";
import { StudentShell } from "@/components/layout/student-shell";
import { getSiteSettings } from "@/server/services/site-settings";
import { getStudentAnnouncementUnreadCount } from "@/server/services/announcements";

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const appUser = await requireAppUser();
  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success ? settingsResult.data.instituteName : "Study Point";

  if (appUser.role === Role.ADMIN) {
    return <AdminShell instituteName={instituteName}>{children}</AdminShell>;
  }

  if (appUser.role === Role.TEACHER) {
    if (!appUser.teacherId) redirect("/unauthorized");
    const assignments = await db.teacherAssignment.findMany({
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
              select: { classLevel: true, subject: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const batches = assignments.map((a) => ({
      id: a.batch.id,
      name: a.batch.name,
      subjectName: a.batch.curriculumTrack.subject.name,
      classLevel: a.batch.curriculumTrack.classLevel,
    }));

    return <TeacherShell batches={batches} instituteName={instituteName}>{children}</TeacherShell>;
  }

  if (appUser.role === Role.STUDENT) {
    if (!appUser.studentId) redirect("/unauthorized");
    
    const student = await db.student.findUnique({
      where: { id: appUser.studentId },
      select: { id: true, fullName: true, studentCode: true },
    });

    const enrolments = await db.enrolment.findMany({
      where: { studentId: appUser.studentId, status: "active", archivedAt: null },
      select: {
        id: true,
        batch: { select: { id: true, name: true } },
        curriculumTrack: { select: { classLevel: true, subject: { select: { name: true } } } },
        academicSession: { select: { name: true } },
      },
    });

    const unreadCount = student ? await getStudentAnnouncementUnreadCount(student.id) : 0;

    return (
      <StudentShell
        studentName={student?.fullName ?? null}
        studentCode={student?.studentCode ?? null}
        enrolments={enrolments}
        unreadCount={unreadCount}
      >
        {children}
      </StudentShell>
    );
  }

  redirect("/unauthorized");
}
