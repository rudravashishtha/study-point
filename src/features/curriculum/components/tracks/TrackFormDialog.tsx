"use client";
"use no memo";

import React, { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CurriculumTrack, Board, Programme, Subject } from "@prisma/client";
import { createCurriculumTrackSchema } from "@/lib/validation/curriculum";
import {
  createTrackAction,
  updateTrackAction,
} from "@/app/admin/curriculum/curriculum-tracks/actions";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type CreateInput = z.infer<typeof createCurriculumTrackSchema>;

export function TrackFormDialog({
  track,
  boards,
  programmes,
  subjects,
  open,
  onOpenChange,
}: {
  track?: CurriculumTrack;
  boards: Board[];
  programmes: Programme[];
  subjects: Subject[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createCurriculumTrackSchema),
    defaultValues: {
      boardId: track?.boardId || "",
      programmeId: track?.programmeId || null,
      classLevel: track?.classLevel || "IX",
      subjectId: track?.subjectId || "",
      displayName: track?.displayName || "",
    },
  });

  const selectedBoardId = useWatch({ control, name: "boardId" });
  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const selectedProgrammeId = useWatch({ control, name: "programmeId" });
  const selectedClassLevel = useWatch({ control, name: "classLevel" });

  useEffect(() => {
    if (open) {
      reset({
        boardId: track?.boardId || "",
        programmeId: track?.programmeId || null,
        classLevel: track?.classLevel || "IX",
        subjectId: track?.subjectId || "",
        displayName: track?.displayName || "",
      });
    }
  }, [open, track, reset]);

  // UX Guidance logic (authoritative check is on server)
  useEffect(() => {
    if (!selectedBoard) return;

    if (selectedBoard.code === "CBSE") {
      setValue("programmeId", null);
    } else if (selectedBoard.code === "CISCE") {
      // Suggest based on class level if changing board to CISCE
      if (selectedClassLevel === "IX" || selectedClassLevel === "X") {
        const icse = programmes.find(
          (p) => p.boardId === selectedBoard.id && p.code === "ICSE",
        );
        if (icse && selectedProgrammeId !== icse.id) setValue("programmeId", icse.id);
      } else {
        const isc = programmes.find(
          (p) => p.boardId === selectedBoard.id && p.code === "ISC",
        );
        if (isc && selectedProgrammeId !== isc.id) setValue("programmeId", isc.id);
      }
    }
  }, [selectedBoard, selectedClassLevel, programmes, selectedProgrammeId, setValue]);

  const onSubmit = (data: CreateInput) => {
    startTransition(async () => {
      const res = track
        ? await updateTrackAction(track.id, { displayName: data.displayName })
        : await createTrackAction(data);

      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(
          track ? "Track updated successfully" : "Track created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  if (!open) return null;

  const filteredProgrammes = selectedBoardId
    ? programmes.filter((p) => p.boardId === selectedBoardId)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{track ? "Edit Track" : "Create Track"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Board *{" "}
              {track && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <select
              {...register("boardId")}
              disabled={!!track}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
            >
              <option value="" disabled>
                Select Board
              </option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
            {errors.boardId && (
              <p className="text-sm font-medium text-destructive">
                {errors.boardId.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Class Level *{" "}
              {track && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <select
              {...register("classLevel")}
              disabled={!!track}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
            >
              <option value="IX">Class IX</option>
              <option value="X">Class X</option>
              <option value="XI">Class XI</option>
              <option value="XII">Class XII</option>
            </select>
            {errors.classLevel && (
              <p className="text-sm font-medium text-destructive">
                {errors.classLevel.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Programme{" "}
              {track && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <Controller
              control={control}
              name="programmeId"
              render={({ field }) => (
                <select
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value || null)}
                  disabled={!!track || selectedBoard?.code === "CBSE"}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                >
                  <option value="">None</option>
                  {filteredProgrammes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.programmeId && (
              <p className="text-sm font-medium text-destructive">
                {errors.programmeId.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Subject *{" "}
              {track && (
                <span className="text-xs text-muted-foreground">(Permanent)</span>
              )}
            </label>
            <select
              {...register("subjectId")}
              disabled={!!track}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
            >
              <option value="" disabled>
                Select Subject
              </option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {errors.subjectId && (
              <p className="text-sm font-medium text-destructive">
                {errors.subjectId.message as string}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name *</label>
            <input
              {...register("displayName")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Class IX Mathematics (CBSE)"
            />
            {errors.displayName && (
              <p className="text-sm font-medium text-destructive">
                {errors.displayName.message as string}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : track ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
