"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Board } from "@prisma/client";
import { createBoardAction, updateBoardAction } from "../../actions/boards";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function BoardFormDialog({
  board,
  open,
  onOpenChange,
}: {
  board?: Board;
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
      const res = board
        ? await updateBoardAction(board.id, { name: payload.name }) // Code is permanent
        : await createBoardAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          board ? "Board updated successfully" : "Board created successfully",
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
          <DialogTitle>{board ? "Edit Board" : "Create Board"}</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              Board Code *{" "}
              {board && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <input
              id="code"
              name="code"
              required
              disabled={!!board}
              defaultValue={board?.code}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              placeholder="e.g. CBSE"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Board Name *
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={board?.name}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Central Board of Secondary Education"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : board ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
