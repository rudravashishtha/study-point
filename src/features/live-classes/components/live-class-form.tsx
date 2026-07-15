"use client";

import { z } from "zod";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useMemo } from "react";
import {
  liveClassSessionSchema,
  CreateLiveClassSessionInput,
} from "@/lib/validation/live-classes";
import { createLiveClassAction, updateLiveClassAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface LiveClassFormProps {
  batches: { id: string; name: string }[];
  teachers: { id: string; displayName: string }[];
  defaultValues?: Partial<CreateLiveClassSessionInput> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}
export function LiveClassForm({
  batches,
  teachers,
  defaultValues,
  onSuccess,
  onCancel,
}: LiveClassFormProps) {
  const [isPending, startTransition] = useTransition();

  const initialValues = useMemo(
    () => ({
      title: defaultValues?.title || "",
      batchId: defaultValues?.batchId || "",
      teacherId: defaultValues?.teacherId || "",
      meetingUrl: defaultValues?.meetingUrl || "",
      status: defaultValues?.status || "SCHEDULED",
      scheduledStartTime: defaultValues?.scheduledStartTime
        ? new Date(defaultValues.scheduledStartTime)
        : new Date(),
      scheduledEndTime: defaultValues?.scheduledEndTime
        ? new Date(defaultValues.scheduledEndTime)
        : new Date(new Date().getTime() + 60 * 60 * 1000),
    }),
    [defaultValues],
  );

  const form = useForm<
    z.input<typeof liveClassSessionSchema>,
    unknown,
    CreateLiveClassSessionInput
  >({
    resolver: zodResolver(liveClassSessionSchema),
    defaultValues: initialValues,
  });

  const onSubmit = (data: CreateLiveClassSessionInput) => {
    startTransition(async () => {
      try {
        let result;
        if (defaultValues?.id) {
          result = await updateLiveClassAction(defaultValues.id, data);
        } else {
          result = await createLiveClassAction(data);
        }

        if (result.success) {
          toast.success("Live class saved successfully.");
          onSuccess?.();
        } else {
          toast.error(result.error?.message || "Something went wrong.");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          toast.error(err.message || "An error occurred");
        } else {
          toast.error("An unknown error occurred");
        }
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...form.register("title")}
          placeholder="e.g. Algebra Revision"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">
            {form.formState.errors.title.message as string}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Batch</Label>
          <Select
            onValueChange={(v) => form.setValue("batchId", v as string)}
            defaultValue={form.getValues("batchId") as string}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select batch" />
            </SelectTrigger>
            <SelectContent>
              {batches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.batchId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.batchId.message as string}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Teacher</Label>
          <Select
            onValueChange={(v) => form.setValue("teacherId", v as string)}
            defaultValue={form.getValues("teacherId") as string}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.teacherId && (
            <p className="text-sm text-destructive">
              {form.formState.errors.teacherId.message as string}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input type="datetime-local" {...form.register("scheduledStartTime")} />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input type="datetime-local" {...form.register("scheduledEndTime")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meetingUrl">Meeting URL (Optional)</Label>
        <Input
          id="meetingUrl"
          {...form.register("meetingUrl")}
          placeholder="https://meet.google.com/..."
        />
        {form.formState.errors.meetingUrl && (
          <p className="text-sm text-destructive">
            {form.formState.errors.meetingUrl.message as string}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Session"}
        </Button>
      </div>
    </form>
  );
}
