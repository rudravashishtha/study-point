import { z } from "zod";

export const SiteSettingsUpdateSchema = z.object({
  instituteName: z
    .string()
    .trim()
    .min(1, "Institute name is required.")
    .max(100)
    .optional(),
  tagline: z.string().trim().max(200).nullable().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number format.")
    .nullable()
    .optional(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^[\d\s\-\+\(\)]+$/, "Invalid WhatsApp number format.")
    .nullable()
    .optional(),
  email: z.string().trim().email("Invalid email address.").nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  landmark: z.string().trim().max(200).nullable().optional(),
  mapUrl: z.string().trim().url("Invalid map URL.").nullable().optional(),
  openingHours: z.string().trim().max(200).nullable().optional(),
  logoFileId: z.string().uuid("Invalid file ID.").nullable().optional(),
  faviconFileId: z.string().uuid("Invalid file ID.").nullable().optional(),
  defaultTitle: z.string().trim().max(100).nullable().optional(),
  defaultDescription: z.string().trim().max(300).nullable().optional(),
  ogImageFileId: z.string().uuid("Invalid file ID.").nullable().optional(),
  socialLinks: z
    .record(z.string(), z.string().url("Invalid social URL."))
    .nullable()
    .optional(),
  heroHeadline: z.string().trim().min(1).max(120).nullable().optional(),
  heroSubheadline: z.string().trim().max(300).nullable().optional(),
  heroCtaText: z.string().trim().min(1).max(50).nullable().optional(),
  heroCtaTarget: z.string().trim().min(1).nullable().optional(),
  feeDisplayEnabled: z.boolean().optional(),
  admissionsOpen: z.boolean().optional(),
  resourcesEnabled: z.boolean().optional(),
  resourcesSearchEnabled: z.boolean().optional(),
});

export type SiteSettingsUpdateInput = z.infer<typeof SiteSettingsUpdateSchema>;
