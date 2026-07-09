import { z } from "zod";

const codeRegex = /^[A-Z0-9_]+$/;

const baseCodeSchema = z
  .string()
  .trim()
  .min(1, "Code is required")
  .regex(codeRegex, "Code must be uppercase alphanumeric without spaces");

const baseNameSchema = z.string().trim().min(1, "Name is required");

// Boards
export const createBoardSchema = z.object({
  code: baseCodeSchema,
  name: baseNameSchema,
});

export const updateBoardSchema = z
  .object({
    name: baseNameSchema,
  })
  .strict(); // strict() explicitly prevents lifecycle fields

// Programmes
export const createProgrammeSchema = z.object({
  boardId: z.string().trim().min(1, "Board is required").uuid("Invalid board ID"),
  code: baseCodeSchema,
  name: baseNameSchema,
});

export const updateProgrammeSchema = z
  .object({
    name: baseNameSchema,
  })
  .strict();

// Subjects
export const createSubjectSchema = z.object({
  code: baseCodeSchema,
  name: baseNameSchema,
});

export const updateSubjectSchema = z
  .object({
    name: baseNameSchema,
  })
  .strict();

// Curriculum Tracks
export const createCurriculumTrackSchema = z.object({
  boardId: z.string().trim().min(1, "Board is required").uuid("Invalid board ID"),
  programmeId: z.string().trim().uuid("Invalid programme ID").nullable().optional(),
  classLevel: z.enum(["IX", "X", "XI", "XII"], {
    message: "Invalid class level",
  }),
  subjectId: z.string().trim().min(1, "Subject is required").uuid("Invalid subject ID"),
  displayName: baseNameSchema,
});

export const updateCurriculumTrackSchema = z
  .object({
    displayName: baseNameSchema,
  })
  .strict();

// Chapters
export const createChapterSchema = z.object({
  curriculumTrackId: z
    .string()
    .trim()
    .min(1, "Track is required")
    .uuid("Invalid track ID"),
  name: baseNameSchema,
});

export const updateChapterSchema = z
  .object({
    name: baseNameSchema,
  })
  .strict();

// Topics
export const createTopicSchema = z.object({
  chapterId: z.string().trim().min(1, "Chapter is required").uuid("Invalid chapter ID"),
  name: baseNameSchema,
});

export const updateTopicSchema = z
  .object({
    name: baseNameSchema,
  })
  .strict();
