"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Trash2, Clock } from "lucide-react";
import { BatchSchedule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { handleActionError } from "@/lib/actions/types";
import { updateBatchSchedulesAction } from "@/features/batches/actions/batch-actions";
import { SubmitButton } from "@/components/ui/submit-button";

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Time must be in HH:mm format");

const scheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: timeStringSchema,
  endTime: timeStringSchema,
  roomOrLocation: z.string().nullable().optional(),
  liveClassUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
});

const formSchema = z.object({
  schedules: z.array(scheduleSchema),
});

type FormValues = z.infer<typeof formSchema>;

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

export function BatchScheduleEditor({
  batch,
  isArchived,
}: {
  batch: { id: string; schedules: BatchSchedule[] };
  isArchived: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schedules: batch.schedules.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        roomOrLocation: s.roomOrLocation ?? "",
        liveClassUrl: s.liveClassUrl ?? "",
        isActive: s.isActive,
      })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "schedules",
    control: form.control,
  });

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await updateBatchSchedulesAction(batch.id, data.schedules);
        if (!result.success) {
          handleActionError(result.error);
          return;
        }
        toast.success("Batch schedules updated successfully");
        // We reset form values to matched saved data to clear any dirty state
        form.reset(data);
      } catch {
        toast.error("An unexpected error occurred");
      }
    });
  };

  if (isArchived) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Schedules</h3>
        {batch.schedules.length === 0 ? (
          <p className="text-muted-foreground text-sm">No schedules assigned.</p>
        ) : (
          <div className="space-y-2">
            {batch.schedules.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 p-3 border rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 w-32">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="font-medium">
                    {DAYS.find((d) => d.value === s.dayOfWeek)?.label}
                  </span>
                </div>
                <div className="text-sm">
                  {s.startTime} - {s.endTime}
                </div>
                <div className="text-sm text-muted-foreground flex-1">
                  {s.roomOrLocation || "No Location"}
                </div>
                {!s.isActive && (
                  <span className="text-xs font-medium text-destructive">Inactive</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Manage Schedules</h3>
            <p className="text-sm text-muted-foreground">
              Define the weekly timetable for this batch.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                dayOfWeek: 1,
                startTime: "09:00",
                endTime: "10:00",
                roomOrLocation: "",
                liveClassUrl: "",
                isActive: true,
              })
            }
            disabled={isPending}
            className="gap-2"
          >
            <Plus className="size-4" />
            Add Schedule
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg">
            <p className="text-muted-foreground mb-4">No schedules defined yet.</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                append({
                  dayOfWeek: 1,
                  startTime: "09:00",
                  endTime: "10:00",
                  roomOrLocation: "",
                  liveClassUrl: "",
                  isActive: true,
                })
              }
            >
              Add First Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-4 p-4 border rounded-md relative"
              >
                <div className="absolute right-2 top-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                    onClick={() => remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mr-8">
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.dayOfWeek`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select
                          onValueChange={(val) => {
                            if (val != null) field.onChange(parseInt(val, 10));
                          }}
                          value={field.value.toString()}
                          disabled={isPending}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS.map((day) => (
                              <SelectItem key={day.value} value={day.value.toString()}>
                                {day.label}
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
                    name={`schedules.${index}.startTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.endTime`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-8">
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.roomOrLocation`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location / Room (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Room 101"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.liveClassUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Live Class Link (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://..."
                            {...field}
                            value={field.value ?? ""}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-2 flex items-center justify-between border-t mt-2">
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.isActive`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 space-y-0">
                        <FormLabel className="text-sm font-medium">Active</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isPending || !form.formState.isDirty}
          >
            Discard Changes
          </Button>
          <SubmitButton type="submit" pending={isPending} disabled={!form.formState.isDirty}>
            {isPending ? "Saving..." : "Save Schedules"}
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
