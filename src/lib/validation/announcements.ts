import { z } from "zod";
import { AnnouncementAudience, AnnouncementPriority } from "@prisma/client";
import { zIsoDateString } from "./common";

export const AnnouncementCreateSchema = z
  .object({
    academicSessionId: z.string().optional().nullable(),
    audience: z.nativeEnum(AnnouncementAudience),
    curriculumTrackId: z.string().optional().nullable(),
    batchId: z.string().optional().nullable(),
    title: z.string().trim().min(1, "Title is required."),
    content: z.string().trim().min(1, "Content is required."),
    priority: z.nativeEnum(AnnouncementPriority).optional().default("NORMAL"),
    publish: z.boolean().optional().default(false),
    expiresAt: zIsoDateString,
  });

export const AnnouncementUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title cannot be empty.").optional(),
  content: z.string().trim().min(1, "Content cannot be empty.").optional(),
  priority: z.nativeEnum(AnnouncementPriority).optional(),
  expiresAt: zIsoDateString,
});
