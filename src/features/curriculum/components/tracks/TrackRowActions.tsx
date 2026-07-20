"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CurriculumTrack } from "@prisma/client";
import {
  archiveTrackAction,
  restoreTrackAction,
} from "@/app/admin/curriculum/curriculum-tracks/actions";
import Link from "next/link";
import { MoreVertical, Settings, Archive, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function TrackRowActions({
  track,
  onEdit,
}: {
  track: CurriculumTrack;
  onEdit: (track: CurriculumTrack) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const handleArchive = () => {
    startTransition(async () => {
      const res = await archiveTrackAction(track.id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Track archived successfully" });
    });
    setArchiveConfirmOpen(false);
  };

  const handleRestore = () => {
    startTransition(async () => {
      const res = await restoreTrackAction(track.id);
      if (!res.success) toast.error("Error", { description: res.error });
      else toast.success("Success", { description: "Track restored successfully" });
    });
  };

  return (
    <>
      <DropdownMenu>
      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted outline-none">
        <MoreVertical className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => router.push(`/admin/curriculum/curriculum-tracks/${track.id}`)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Content
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onEdit(track)}>
            Edit Name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {track.archivedAt ? (
            <DropdownMenuItem onClick={handleRestore} disabled={isPending}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => setArchiveConfirmOpen(true)}
              disabled={isPending}
              className="text-destructive focus:text-destructive"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Archive track?"
        description={`Are you sure you want to archive "${track.displayName}"? It can be restored later.`}
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />
    </>
  );
}
