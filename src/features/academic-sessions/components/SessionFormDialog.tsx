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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

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
    session ? updateSessionAction : createSessionAction,
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

    execute(
      actionArgs as /* eslint-disable-line @typescript-eslint/no-explicit-any -- Justified: Server action boundary */ any,
      {
        onError: (err) => toast.error("Error", { description: err }),
        onSuccess: () => {
          toast.success("Success", { description: session ? "Session updated successfully" : "Session created successfully" });
          onOpenChange(false);
          router.refresh();
        },
      },
    );
  };

  const startsOnValue = session?.startsOn
    ? new Date(session.startsOn).toISOString().split("T")[0]
    : "";
  const endsOnValue = session?.endsOn
    ? new Date(session.endsOn).toISOString().split("T")[0]
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{session ? "Edit Session" : "Create Session"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="session-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
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
            <div className="space-y-3">
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
            <div className="space-y-3">
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
          </form>
        </div>

        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton type="submit" form="session-form" pending={isPending}>
            {isPending ? "Saving..." : session ? "Save Changes" : "Create"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
