"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit2, Archive, ArchiveRestore, Users, ExternalLink } from "lucide-react";
import {
  Batch,
  AcademicSession,
  CurriculumTrack,
  Board,
  Subject,
  Programme,
} from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { handleActionError } from "@/lib/actions/types";
import { archiveBatchAction, restoreBatchAction } from "@/app/admin/batches/actions";
import { useState } from "react";
import { BatchFormDialog } from "./BatchFormDialog";

type TrackWithRelations = CurriculumTrack & {
  board: Board;
  subject: Subject;
  programme: Programme | null;
};

type BatchWithRelations = Batch & {
  academicSession: AcademicSession;
  curriculumTrack: TrackWithRelations;
  _count: {
    enrolments: number;
  };
};

export function BatchList({
  batches,
  sessions,
  tracks,
}: {
  batches: BatchWithRelations[];
  sessions: AcademicSession[];
  tracks: TrackWithRelations[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingBatch, setEditingBatch] = useState<BatchWithRelations | null>(null);

  const onArchive = (id: string) => {
    startTransition(async () => {
      try {
        const result = await archiveBatchAction(id);
        if (!result.success) {
          handleActionError(result.error);
          return;
        }
        toast.success("Batch archived successfully");
        router.refresh();
      } catch {
        toast.error("Failed to archive batch");
      }
    });
  };

  const onRestore = (id: string) => {
    startTransition(async () => {
      try {
        const result = await restoreBatchAction(id);
        if (!result.success) {
          handleActionError(result.error);
          return;
        }
        toast.success("Batch restored successfully");
        router.refresh();
      } catch {
        toast.error("Failed to restore batch");
      }
    });
  };

  return (
    <>
      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch Name</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Occupied Seats</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id} className={batch.archivedAt ? "opacity-60" : ""}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {batch.name}
                    {!batch.isActive && !batch.archivedAt && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{batch.academicSession.name}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>
                      {batch.curriculumTrack.displayName ||
                        `${batch.curriculumTrack.subject.name} - Class ${batch.curriculumTrack.classLevel}`}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {batch.curriculumTrack.board.code}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span>
                      {batch._count.enrolments} / {batch.capacity ?? "Unlimited"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {batch.archivedAt ? (
                    <Badge variant="destructive">Archived</Badge>
                  ) : (
                    <Badge
                      variant="default"
                      className="bg-green-500/10 text-green-700 hover:bg-green-500/20"
                    >
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                      <Link href={`/admin/batches/${batch.id}`}>
                        <ExternalLink className="size-4" />
                        <span className="sr-only sm:not-sr-only">Details</span>
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingBatch(batch)}
                      disabled={isPending || !!batch.archivedAt}
                    >
                      <Edit2 className="size-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    {batch.archivedAt ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onRestore(batch.id)}
                        disabled={isPending}
                      >
                        <ArchiveRestore className="size-4" />
                        <span className="sr-only">Restore</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onArchive(batch.id)}
                        disabled={isPending}
                      >
                        <Archive className="size-4" />
                        <span className="sr-only">Archive</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BatchFormDialog
        open={!!editingBatch}
        onOpenChange={(open) => {
          if (!open) setEditingBatch(null);
        }}
        batch={editingBatch ?? undefined}
        sessions={sessions}
        tracks={tracks}
      />
    </>
  );
}
