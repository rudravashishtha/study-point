"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { AcademicSession } from "@prisma/client";
import {
  createSessionAction,
  updateSessionAction,
} from "@/app/admin/academic-sessions/actions";
import { useRouter } from "next/navigation";

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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      startsOn: (formData.get("startsOn") as string) || "",
      endsOn: (formData.get("endsOn") as string) || "",
    };

    startTransition(async () => {
      const res = session
        ? await updateSessionAction(session.id, payload)
        : await createSessionAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          session ? "Session updated successfully" : "Session created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  if (!open) return null;

  const startsOnValue = session?.startsOn
    ? new Date(session.startsOn).toISOString().split("T")[0]
    : "";
  const endsOnValue = session?.endsOn
    ? new Date(session.endsOn).toISOString().split("T")[0]
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-md border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {session ? "Edit Session" : "Create Session"}
        </h2>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Saving..." : session ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
