"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Board } from "@prisma/client";
import { createBoardAction, updateBoardAction } from "../../actions/boards";
import { useRouter } from "next/navigation";

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-md border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {board ? "Edit Board" : "Create Board"}
        </h2>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
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
              {isPending ? "Saving..." : board ? "Save Changes" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
