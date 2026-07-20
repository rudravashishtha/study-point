"use client";

import { useTransition } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export interface ReorderControlsProps {
  id: string;
  isFirst: boolean;
  isLast: boolean;
  onMove: (
    id: string,
    direction: "UP" | "DOWN",
  ) => Promise<{ success: boolean; error?: string }>;
}

export function ReorderControls({ id, isFirst, isLast, onMove }: ReorderControlsProps) {
  const [isPending, startTransition] = useTransition();

  const handleMove = (direction: "UP" | "DOWN") => {
    startTransition(async () => {
      const res = await onMove(id, direction);
      if (!res.success) {
        toast.error("Error", { description: res.error || `Failed to move ${direction.toLowerCase()}` });
      }
    });
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        type="button"
        disabled={isFirst || isPending}
        onClick={() => handleMove("UP")}
        className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:hover:bg-muted"
        aria-label="Move up"
      >
        <ArrowUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        disabled={isLast || isPending}
        onClick={() => handleMove("DOWN")}
        className="flex h-6 w-6 items-center justify-center rounded-sm bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-30 disabled:hover:bg-muted"
        aria-label="Move down"
      >
        <ArrowDown className="h-3 w-3" />
      </button>
    </div>
  );
}
