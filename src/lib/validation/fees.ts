import { z } from "zod";

const FeePlanAmountSchema = z
  .number()
  .positive("Total amount must be positive.")
  .max(9999999.99, "Amount too large.");

const FeePlanFrequencySchema = z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]);

const UuidOptional = z.string().uuid().optional().nullable();

const InstallmentCreateSchema = z.object({
  label: z.string().trim().min(1, "Installment label is required."),
  dueOffsetDays: z.number().int().positive().optional().nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD")
    .optional()
    .nullable(),
  amount: z.number().positive("Installment amount must be positive.").max(9999999.99),
  displayOrder: z.number().int().min(0).default(0),
});

const InstallmentUpdateSchema = InstallmentCreateSchema.extend({
  id: z.string().uuid().optional(),
});

export const FeePlanCreateSchema = z
  .object({
    academicSessionId: z.string().uuid("Academic session is required."),
    curriculumTrackId: z.string().uuid("Curriculum track is required."),
    batchId: UuidOptional,
    name: z.string().trim().min(1, "Fee plan name is required."),
    description: z.string().trim().max(2000).optional().nullable(),
    totalAmount: FeePlanAmountSchema,
    frequency: FeePlanFrequencySchema,
    showPublicly: z.boolean().default(false),
    instalments: z.array(InstallmentCreateSchema).default([]),
  })
  .refine(
    (data) => {
      if (data.frequency === "CUSTOM") {
        return data.instalments.length > 0;
      }
      return true;
    },
    {
      message: "Custom frequency fee plans must have at least one installment.",
      path: ["instalments"],
    },
  );

export const FeePlanUpdateSchema = z
  .object({
    batchId: UuidOptional,
    name: z.string().trim().min(1, "Fee plan name is required.").optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    totalAmount: FeePlanAmountSchema.optional(),
    frequency: FeePlanFrequencySchema.optional(),
    showPublicly: z.boolean().optional(),
    isActive: z.boolean().optional(),
    instalments: z.array(InstallmentUpdateSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.frequency === "CUSTOM") {
        return data.instalments && data.instalments.length > 0;
      }
      return true;
    },
    {
      message: "Custom frequency fee plans must have at least one installment.",
      path: ["instalments"],
    },
  );

export const FeePlanListParamsSchema = z.object({
  query: z.string().optional().default(""),
  archiveState: z.enum(["active", "archived", "all"]).optional().default("active"),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"]).optional(),
});
