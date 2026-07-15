import { z } from "zod";
import { Role } from "@prisma/client";

export const liveClassSessionSchema = z
  .object({
    batchId: z.string().uuid("Invalid batch ID"),
    teacherId: z.string().uuid("Invalid teacher ID"),
    title: z.string().min(1, "Title is required"),
    scheduledStartTime: z.union([z.date(), z.string()]).pipe(z.coerce.date()),
    scheduledEndTime: z.union([z.date(), z.string()]).pipe(z.coerce.date()),
    meetingUrl: z
      .union([z.string().url("Must be a valid URL"), z.literal(""), z.null()])
      .transform((v) => (v === "" ? null : v))
      .optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).default("SCHEDULED"),
  })
  .refine((data) => data.scheduledEndTime > data.scheduledStartTime, {
    message: "End time must be after start time",
    path: ["scheduledEndTime"],
  });

export type CreateLiveClassSessionInput = z.infer<typeof liveClassSessionSchema>;
export type UpdateLiveClassSessionInput = Partial<CreateLiveClassSessionInput>;

export type LiveClassSessionDTO = {
  id: string;
  title: string;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  meetingUrl: string | null;
  batch: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    displayName: string;
  };
};

export type Actor = {
  id: string;
  role: Role | string;
  teacherId?: string | null;
};
