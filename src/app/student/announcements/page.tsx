import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { listStudentAnnouncements } from "@/server/services/announcements";
import { StudentAnnouncementList } from "@/features/announcements/components/StudentAnnouncementList";
import { EmptyState } from "@/components/feedback/empty-state";
import { db } from "@/lib/db";
import { ActorContext } from "@/lib/domain/actor";

export default async function StudentAnnouncementsPage() {
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
        icon={Megaphone}
        title="No Active Courses"
        description="You are not currently enrolled in any active courses."
      />
    );
  }

  const actor: ActorContext = {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };

  const result = await listStudentAnnouncements(actor);
  if (!result.success) {
    if (result.error.code === "UNAUTHORIZED") {
      redirect("/unauthorized");
    }
    return (
      <EmptyState
        icon={Megaphone}
        title="Error loading notices"
        description={result.error.message}
      />
    );
  }

  const announcements = result.data.items;

  if (announcements.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No Notices"
        description="There are currently no notices for your courses."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
        <p className="text-muted-foreground">Recent announcements for your courses.</p>
      </div>

      <div className="border rounded-md bg-card text-card-foreground shadow-sm">
        <StudentAnnouncementList announcements={announcements} />
      </div>
    </div>
  );
}
