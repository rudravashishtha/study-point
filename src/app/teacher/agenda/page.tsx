import { getLiveClassSessionsForTeacher } from "@/server/services/live-classes";
import { AgendaView } from "@/features/live-classes/components/agenda-view";
import { LiveClassForm } from "@/features/live-classes/components/live-class-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function TeacherAgendaPage() {
  const appUser = await requireRole(Role.TEACHER);
  if (!appUser.teacherId) {
    redirect("/unauthorized");
  }

  const sessions = await getLiveClassSessionsForTeacher(appUser.teacherId);
  const teacher = await db.teacher.findUnique({
    where: { id: appUser.teacherId },
    select: { id: true, displayName: true },
  });

  const assignments = await db.teacherAssignment.findMany({
    where: {
      teacherId: appUser.teacherId,
      archivedAt: null,
      permissions: { has: "SCHEDULE_MANAGE" },
    },
    include: {
      batch: { select: { id: true, name: true, isActive: true, archivedAt: true } },
    },
  });

  const batches = assignments
    .map((a) => a.batch)
    .filter((b) => b.isActive && !b.archivedAt);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">My Agenda</h1>
        {batches.length > 0 && teacher && (
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              <Plus className="size-4 mr-2" /> Schedule Class
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Live Class</DialogTitle>
              </DialogHeader>
              <LiveClassForm
                batches={batches}
                teachers={[teacher]}
                defaultValues={{ teacherId: teacher.id }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <AgendaView
        sessions={sessions}
        role="TEACHER"
        batches={batches}
        teachers={teacher ? [teacher] : []}
      />
    </div>
  );
}
