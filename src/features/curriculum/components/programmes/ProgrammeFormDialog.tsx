"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Programme, Board } from "@prisma/client";
import { createProgrammeAction, updateProgrammeAction } from "../../actions/programmes";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ProgrammeFormDialog({
  programme,
  boards,
  open,
  onOpenChange,
}: {
  programme?: Programme;
  boards: Board[];
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
      boardId: (formData.get("boardId") as string) || "",
      code: (formData.get("code") as string) || "",
      name: (formData.get("name") as string) || "",
    };

    startTransition(async () => {
      const res = programme
        ? await updateProgrammeAction(programme.id, { name: payload.name }) // Code and boardId are permanent
        : await createProgrammeAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          programme ? "Programme updated successfully" : "Programme created successfully",
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
          <DialogTitle>{programme ? "Edit Programme" : "Create Programme"}</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="boardId" className="text-sm font-medium">
              Board *{" "}
              {programme && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <select
              id="boardId"
              name="boardId"
              required
              disabled={!!programme}
              defaultValue={programme?.boardId || ""}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              <option value="" disabled>
                Select a board
              </option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Programme Code *{" "}
              {programme && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <input
              id="code"
              name="code"
              required
              disabled={!!programme}
              defaultValue={programme?.code}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              placeholder="e.g. CLASS_10"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Programme Name *
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={programme?.name}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Class 10th Board"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : programme ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
