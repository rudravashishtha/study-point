"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Subject } from "@prisma/client";
import { createSubjectAction, updateSubjectAction } from "../../actions/subjects";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function SubjectFormDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject?: Subject;
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
      code: (formData.get("code") as string) || "",
      name: (formData.get("name") as string) || "",
    };

    startTransition(async () => {
      const res = subject
        ? await updateSubjectAction(subject.id, { name: payload.name }) // Code is permanent
        : await createSubjectAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          subject ? "Subject updated successfully" : "Subject created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{subject ? "Edit Subject" : "Create Subject"}</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Subject Code *{" "}
              {subject && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <input
              id="code"
              name="code"
              required
              disabled={!!subject}
              defaultValue={subject?.code}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              placeholder="e.g. MATH"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Subject Name *
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={subject?.name}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Mathematics"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : subject ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
