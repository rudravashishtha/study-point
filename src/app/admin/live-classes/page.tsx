import { getLiveClassSessionsForAdmin } from "@/server/services/live-classes";
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

export default async function AdminLiveClassesPage() {
  await requireRole(Role.ADMIN);

  const sessions = await getLiveClassSessionsForAdmin();
  const batches = await db.batch.findMany({
    where: { isActive: true, archivedAt: null },
    select: { id: true, name: true },
  });
  const teachers = await db.teacher.findMany({ select: { id: true, displayName: true } });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Live Classes</h1>
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            <Plus className="size-4 mr-2" /> Schedule Class
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Live Class</DialogTitle>
            </DialogHeader>
            <LiveClassForm batches={batches} teachers={teachers} />
          </DialogContent>
        </Dialog>
      </div>
      <AgendaView
        sessions={sessions}
        role="ADMIN"
        batches={batches}
        teachers={teachers}
      />
    </div>
  );
}
