"use client";

import React, { useState } from "react";
import { CurriculumTrack, Board, Programme, Subject } from "@prisma/client";
import { TrackFormDialog } from "./TrackFormDialog";
import { TrackRowActions } from "./TrackRowActions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TrackWithRelations = CurriculumTrack & {
  board: { id: string; name: string; code: string; archivedAt: Date | null };
  programme: { id: string; name: string; code: string; archivedAt: Date | null } | null;
  subject: { id: string; name: string; code: string; archivedAt: Date | null };
};

export function TrackList({
  tracks,
  boards,
  programmes,
  subjects,
}: {
  tracks: TrackWithRelations[];
  boards: Board[];
  programmes: Programme[];
  subjects: Subject[];
}) {
  const [editingTrack, setEditingTrack] = useState<CurriculumTrack | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleEdit = (track: CurriculumTrack) => {
    setEditingTrack(track);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingTrack(undefined);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Track
        </button>
      </div>

      <div className="rounded-md border bg-card w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Board</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Programme</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No curriculum tracks found.
                </TableCell>
              </TableRow>
            ) : (
              tracks.map((track) => (
                <TableRow key={track.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-medium">{track.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {track.board.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {track.classLevel}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {track.programme?.code || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {track.subject.name}
                  </TableCell>
                  <TableCell>
                    {track.archivedAt ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <TrackRowActions track={track} onEdit={handleEdit} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TrackFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        track={editingTrack}
        boards={boards}
        programmes={programmes}
        subjects={subjects}
      />
    </div>
  );
}
