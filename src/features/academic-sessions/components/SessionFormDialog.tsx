"use client";

import React from "react";
import { toast } from "sonner";
import { AcademicSession } from "@prisma/client";
import {
  createSessionAction,
  updateSessionAction,
} from "@/app/admin/academic-sessions/actions";
import { useServerAction } from "@/hooks/use-server-action";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SessionFormDialog({
  session,
  open,
  onOpenChange,
}: {
  session?: AcademicSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { isPending, error, execute } = useServerAction(
    session ? updateSessionAction : createSessionAction
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      startsOn: (formData.get("startsOn") as string) || "",
      endsOn: (formData.get("endsOn") as string) || "",
    };

    const actionArgs = session ? [session.id, payload] : [payload];

    execute(actionArgs as any, {
      onError: (err) => toast.error(err),
      onSuccess: () => {
        toast.success(session ? "Session updated successfully" : "Session created successfully");
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  const startsOnValue = session?.startsOn
    ? new Date(session.startsOn).toISOString().split("T")[0]
    : "";
  const endsOnValue = session?.endsOn
    ? new Date(session.endsOn).toISOString().split("T")[0]
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{session ? "Edit Session" : "Create Session"}</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Session Name *
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={session?.name}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. 2026-27"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="startsOn" className="text-sm font-medium">
              Start Date
            </label>
            <input
              id="startsOn"
              name="startsOn"
              type="date"
              defaultValue={startsOnValue}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="endsOn" className="text-sm font-medium">
              End Date
            </label>
            <input
              id="endsOn"
              name="endsOn"
              type="date"
              defaultValue={endsOnValue}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : session ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
