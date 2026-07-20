"use client";
"use no memo";

import React, { useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CurriculumTrack, Board, Subject } from "@prisma/client";
import { createCurriculumTrackSchema } from "@/lib/validation/curriculum";
import {
  createTrackAction,
  updateTrackAction,
} from "@/app/admin/curriculum/curriculum-tracks/actions";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

type CreateInput = z.infer<typeof createCurriculumTrackSchema>;

export function TrackFormDialog({
  track,
  boards,
  subjects,
  open,
  onOpenChange,
}: {
  track?: CurriculumTrack;
  boards: Board[];
  subjects: Subject[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateInput>({
    resolver: zodResolver(createCurriculumTrackSchema),
    defaultValues: {
      boardId: track?.boardId || "",
      classLevel: track?.classLevel || "IX",
      subjectId: track?.subjectId || "",
      displayName: track?.displayName || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        boardId: track?.boardId || "",
        classLevel: track?.classLevel || "IX",
        subjectId: track?.subjectId || "",
        displayName: track?.displayName || "",
      });
    }
  }, [open, track, reset]);

  const onSubmit = (data: CreateInput) => {
    startTransition(async () => {
      const res = track
        ? await updateTrackAction(track.id, { displayName: data.displayName })
        : await createTrackAction(data);

      if (!res.success) {
        toast.error("Error", { description: res.error });
      } else {
        toast.success("Success", { description: track ? "Track updated successfully" : "Track created successfully" });
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{track ? "Edit Track" : "Create Track"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="track-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Track Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block mb-1.5 text-sm font-medium">
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

                <div className="space-y-3">
                  <label className="block mb-1.5 text-sm font-medium">
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

                <div className="space-y-3">
                  <label className="block mb-1.5 text-sm font-medium">
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
                  <label className="block mb-1.5 text-sm font-medium">Display Name *</label>
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
              </div>
            </section>
          </form>
        </div>

        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton type="submit" form="track-form" pending={isPending}>
            {isPending ? "Saving..." : track ? "Save Changes" : "Create"}
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
