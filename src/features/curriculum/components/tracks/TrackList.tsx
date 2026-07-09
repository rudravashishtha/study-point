"use client";

import React, { useState } from "react";
import { CurriculumTrack, Board, Programme, Subject } from "@prisma/client";
import { TrackFormDialog } from "./TrackFormDialog";
import { TrackRowActions } from "./TrackRowActions";

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

      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Board</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Programme</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No curriculum tracks found.
                  </td>
                </tr>
              ) : (
                tracks.map((track) => (
                  <tr
                    key={track.id}
                    className="border-b transition-colors hover:bg-muted/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{track.displayName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {track.board.code}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {track.classLevel}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {track.programme?.code || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {track.subject.name}
                    </td>
                    <td className="px-4 py-3">
                      {track.archivedAt ? (
                        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          Archived
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TrackRowActions track={track} onEdit={handleEdit} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
