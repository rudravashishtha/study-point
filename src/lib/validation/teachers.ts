import { z } from "zod";

export const createTeacherSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  bio: z.string().max(1000).optional().nullable(),
  qualifications: z.string().max(500).optional().nullable(),
  photoFileId: z.string().uuid().optional().nullable(),
  subjects: z.array(z.string()).optional().default([]),
});

export const updateTeacherSchema = createTeacherSchema.extend({
  active: z.boolean().optional(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
