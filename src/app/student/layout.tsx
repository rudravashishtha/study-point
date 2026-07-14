import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getStudentAnnouncementUnreadCount } from "@/server/services/announcements";
import { StudentShell } from "@/components/layout/student-shell";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const appUser = await requireRole(Role.STUDENT);

  if (!appUser.studentId) {
    redirect("/unauthorized");
  }

  const student = await db.student.findUnique({
    where: { id: appUser.studentId },
    select: {
      id: true,
      fullName: true,
      studentCode: true,
    },
  });

  const enrolments = await db.enrolment.findMany({
    where: { studentId: appUser.studentId, status: "active", archivedAt: null },
    select: {
      id: true,
      batch: {
        select: { id: true, name: true },
      },
      curriculumTrack: {
        select: { classLevel: true, subject: { select: { name: true } } },
      },
      academicSession: {
        select: { name: true },
      },
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
