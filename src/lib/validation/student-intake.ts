import { StudentIntakeSubmissionStatus } from "@prisma/client";
import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);

export const createIntakeLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(120),
  academicSessionId: z.string().uuid(),
  curriculumTrackId: z.string().uuid().optional().nullable(),
  batchId: z.string().uuid().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  maxSubmissions: z.coerce.number().int().min(1).max(10000).optional().nullable(),
});

export const publicIntakeSubmissionSchema = z.object({
  token: z.string().trim().min(16).max(256),
  studentName: z.string().trim().min(1, "Student name is required").max(120),
  phone: optionalText(24),
  guardianName: optionalText(120),
  guardianPhone: optionalText(24),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(160)
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((value) => value || null),
  school: optionalText(160),
  address: optionalText(500),
  message: optionalText(800),
});

export const listIntakeLinksSchema = z.object({
  q: z.string().trim().optional(),
  archiveState: z.enum(["ACTIVE_ONLY", "ARCHIVED_ONLY", "ALL"]).default("ACTIVE_ONLY"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const listIntakeSubmissionsSchema = z.object({
  q: z.string().trim().optional(),
  status: z.nativeEnum(StudentIntakeSubmissionStatus).optional(),
  academicSessionId: z.string().uuid().optional(),
  curriculumTrackId: z.string().uuid().optional(),
  batchId: z.string().uuid().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export const updateSubmissionReviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum([
    StudentIntakeSubmissionStatus.CONTACTED,
    StudentIntakeSubmissionStatus.REVIEWED,
  ]),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
});

export const rejectSubmissionSchema = z.object({
  id: z.string().uuid(),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
});

export const convertSubmissionSchema = z.object({
  id: z.string().uuid(),
  createEnrolment: z.boolean().default(true),
});

export type CreateIntakeLinkInput = z.infer<typeof createIntakeLinkSchema>;
export type PublicIntakeSubmissionInput = z.infer<typeof publicIntakeSubmissionSchema>;
export type ListIntakeLinksInput = z.infer<typeof listIntakeLinksSchema>;
export type ListIntakeSubmissionsInput = z.infer<typeof listIntakeSubmissionsSchema>;
export type UpdateSubmissionReviewInput = z.infer<typeof updateSubmissionReviewSchema>;
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>;
export type ConvertSubmissionInput = z.infer<typeof convertSubmissionSchema>;
