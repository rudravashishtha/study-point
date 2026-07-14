"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import dynamic from "next/dynamic";

const BatchFormDialog = dynamic(
  () =>
    import("@/features/batches/components/BatchFormDialog").then(
      (m) => m.BatchFormDialog,
    ),
  { loading: () => null },
);
import {
  AcademicSession,
  CurriculumTrack,
  Board,
  Subject,
  Programme,
} from "@prisma/client";

type TrackWithRelations = CurriculumTrack & {
  board: Board;
  subject: Subject;
  programme: Programme | null;
};

export function CreateBatchButton({
  sessions,
  tracks,
}: {
  sessions: AcademicSession[];
  tracks: TrackWithRelations[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" />
        New Batch
      </Button>
      <BatchFormDialog
        open={open}
        onOpenChange={setOpen}
        sessions={sessions}
        tracks={tracks}
      />
    </>
  );
}
