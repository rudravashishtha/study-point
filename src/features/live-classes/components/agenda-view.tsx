"use client";

import { format } from "date-fns";
import { LiveClassSessionDTO } from "@/lib/validation/live-classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LiveClassForm } from "./live-class-form";
import { Pencil, XCircle } from "lucide-react";
import { cancelLiveClassAction } from "../actions";
import { useTransition, useState } from "react";
import { toast } from "sonner";

export function AgendaView({
  sessions,
  role,
  batches = [],
  teachers = [],
}: {
  sessions: LiveClassSessionDTO[];
  role: "ADMIN" | "TEACHER" | "STUDENT";
  batches?: { id: string; name: string }[];
  teachers?: { id: string; displayName: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    startTransition(async () => {
      const result = await cancelLiveClassAction(id);
      if (result.success) {
        toast.success("Success", { description: "Class cancelled successfully" });
        setCancelingId(null);
      } else {
        toast.error("Error", { description: result.error?.message || "Failed to cancel class" });
      }
    });
  };

  return (
    <div className="space-y-4">
      {sessions.length === 0 ? (
        <p className="text-muted-foreground">No upcoming live classes scheduled.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="p-4 rounded-md border shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div>
                <h3 className="font-medium text-lg">{session.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {session.batch.name} • {session.teacher.displayName}
                </p>
                <p className="text-sm mt-2">
                  {format(new Date(session.scheduledStartTime), "PPP p")} -{" "}
                  {format(new Date(session.scheduledEndTime), "p")}
                </p>
                <div className="mt-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      session.status === "SCHEDULED"
                        ? "bg-blue-100 text-blue-800"
                        : session.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {session.meetingUrl && session.status !== "CANCELLED" && (
                  <a
                    href={session.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center justify-center rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 h-7 text-[0.8rem] font-medium transition-all hover:bg-muted hover:text-foreground shadow-sm"
                  >
                    Join Class
                  </a>
                )}

                {role !== "STUDENT" && session.status !== "CANCELLED" && (
                  <>
                    <Dialog
                      open={editingId === session.id}
                      onOpenChange={(open) => setEditingId(open ? session.id : null)}
                    >
                      <DialogTrigger
                        render={
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" />
                        }
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Live Class</DialogTitle>
                        </DialogHeader>
                        <LiveClassForm
                          batches={batches}
                          teachers={teachers}
                          defaultValues={session}
                          onSuccess={() => setEditingId(null)}
                          onCancel={() => setEditingId(null)}
                        />
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={cancelingId === session.id}
                      onOpenChange={(open) => setCancelingId(open ? session.id : null)}
                    >
                      <DialogTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            disabled={isPending}
                          />
                        }
                      >
                        <XCircle className="size-4" />
                        <span className="sr-only">Cancel</span>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Cancel Class</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <p>Are you sure you want to cancel this class?</p>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setCancelingId(null)}
                            disabled={isPending}
                          >
                            No, keep it
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleCancel(session.id)}
                            disabled={isPending}
                          >
                            {isPending ? "Canceling..." : "Yes, cancel class"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
