"use client";

import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Batch,
  AcademicSession,
  CurriculumTrack,
  Board,
  Subject,
  Programme,
} from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleActionError } from "@/lib/actions/types";
import { createBatchAction, updateBatchDetailsAction } from "@/app/admin/batches/actions";

type TrackWithRelations = CurriculumTrack & {
  board: Board;
  subject: Subject;
  programme: Programme | null;
};

const formSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
  academicSessionId: z.string().uuid("Invalid academic session ID"),
  curriculumTrackId: z.string().uuid("Invalid curriculum track ID"),
  capacity: z
    .number()
    .int()
    .positive("Capacity must be a positive integer")
    .optional()
    .nullable(),
  isActive: z.boolean(),
  isPublic: z.boolean(),
  showFeePublicly: z.boolean(),
});
type FormValues = z.infer<typeof formSchema>;

export function BatchFormDialog({
  open,
  onOpenChange,
  batch,
  sessions,
  tracks,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch?: Batch;
  sessions: AcademicSession[];
  tracks: TrackWithRelations[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!batch;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: batch?.name ?? "",
      academicSessionId: batch?.academicSessionId ?? "",
      curriculumTrackId: batch?.curriculumTrackId ?? "",
      capacity: batch?.capacity ?? null,
      isActive: batch?.isActive ?? true,
      isPublic: batch?.isPublic ?? false,
      showFeePublicly: batch?.showFeePublicly ?? false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: batch?.name ?? "",
        academicSessionId: batch?.academicSessionId ?? "",
        curriculumTrackId: batch?.curriculumTrackId ?? "",
        capacity: batch?.capacity ?? null,
        isActive: batch?.isActive ?? true,
        isPublic: batch?.isPublic ?? false,
        showFeePublicly: batch?.showFeePublicly ?? false,
      });
    }
  }, [open, batch, form]);

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = isEditing
          ? await updateBatchDetailsAction(batch.id, data)
          : await createBatchAction(data);

        if (!result.success) {
          handleActionError(result.error);
          return;
        }

        toast.success(`Batch ${isEditing ? "updated" : "created"} successfully`);
        onOpenChange(false);
        router.refresh();
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  };

  // Safe Composition Filters (per plan requirements)
  const availableSessions = sessions.filter((s) => s.isActive && !s.archivedAt);
  const availableTracks = tracks.filter((t) => {
    if (t.archivedAt) return false;
    if (t.board.archivedAt) return false;
    if (t.subject.archivedAt) return false;
    if (t.programme && t.programme.archivedAt) return false;
    return true;
  });

  // If editing, allow currently selected session/track even if it became archived/inactive since creation.
  const displaySessions =
    isEditing && batch
      ? sessions.filter(
          (s) => s.id === batch.academicSessionId || (s.isActive && !s.archivedAt),
        )
      : availableSessions;

  const displayTracks =
    isEditing && batch
      ? tracks.filter(
          (t) => t.id === batch.curriculumTrackId || availableTracks.includes(t),
        )
      : availableTracks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Batch" : "Create Batch"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify the batch details. Schedules and students are managed in the batch detail view."
              : "Create a new batch for a specific session and curriculum track."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Batch Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Morning Batch" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="academicSessionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Session</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {displaySessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name} {session.archivedAt ? "(Archived)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="curriculumTrackId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curriculum Track</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select track..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {displayTracks.map((track) => (
                        <SelectItem key={track.id} value={track.id}>
                          {track.displayName ||
                            `${track.board.code} - ${track.subject.name} - Class ${track.classLevel}`}
                          {track.archivedAt ? " (Archived)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 25"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        field.onChange(val === "" ? null : parseInt(val, 10));
                      }}
                    />
                  </FormControl>
                  <FormDescription>Leave empty for unlimited capacity.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Can students be assigned?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Public</FormLabel>
                      <FormDescription>Visible on website?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="showFeePublicly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Show Fee Publicly</FormLabel>
                    <FormDescription>
                      Display the fee on the public website?
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Batch"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
