"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CurriculumTrack } from "@prisma/client";
import {
  archiveTrackAction,
  restoreTrackAction,
} from "@/app/admin/curriculum/curriculum-tracks/actions";
import Link from "next/link";
import { MoreVertical, Settings, Archive, RotateCcw } from "lucide-react";

export function TrackRowActions({
  track,
  onEdit,
}: {
  track: CurriculumTrack;
  onEdit: (track: CurriculumTrack) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleArchive = () => {
    if (confirm("Are you sure you want to archive this track?")) {
      startTransition(async () => {
        const res = await archiveTrackAction(track.id);
        if (!res.success) toast.error(res.error);
        else toast.success("Track archived successfully");
      });
    }
  };

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreTrackAction(track.id);
      if (!res.success) toast.error(res.error);
      else toast.success("Track restored successfully");
    });
  };

  return (
    <div className="relative inline-block text-left group">
      <button className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Dropdown Menu */}
      <div className="absolute right-0 top-8 z-50 hidden w-48 rounded-md border bg-popover text-popover-foreground shadow-md outline-none group-hover:block hover:block">
        <div className="p-1">
          <Link
            href={`/admin/curriculum/curriculum-tracks/${track.id}`}
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Content
          </Link>
          <button
            onClick={() => onEdit(track)}
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            Edit Name
          </button>

          <div className="my-1 h-px bg-muted" />

          {track.archivedAt ? (
            <button
              onClick={handleRestore}
              disabled={isPending}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </button>
          ) : (
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
