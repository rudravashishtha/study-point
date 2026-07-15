import { cache } from "react";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { DomainError } from "../../lib/domain/errors";
import { ServiceResult, success, failure } from "./types";
import { Prisma } from "@prisma/client";

export interface SiteSettingsData {
  id: string;
  instituteName: string;
  tagline: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  address: string | null;
  landmark: string | null;
  mapUrl: string | null;
  openingHours: string | null;
  logoFileId: string | null;
  faviconFileId: string | null;
  defaultTitle: string | null;
  defaultDescription: string | null;
  ogImageFileId: string | null;
  socialLinks: Record<string, string> | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  heroCtaText: string | null;
  heroCtaTarget: string | null;
  feeDisplayEnabled: boolean;
  admissionsOpen: boolean;
  resourcesEnabled: boolean;
  resourcesSearchEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}



const DEFAULT_SETTINGS: Omit<
  SiteSettingsData,
  "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> = {
  instituteName: "Study Point",
  tagline: "Excellence in Mathematics",
  phone: null,
  whatsappNumber: null,
  email: null,
  address: null,
  landmark: null,
  mapUrl: null,
  openingHours: null,
  logoFileId: null,
  faviconFileId: null,
  defaultTitle: null,
  defaultDescription: null,
  ogImageFileId: null,
  socialLinks: null,
  heroHeadline: "Mathematics Coaching for Classes IX–XII",
  heroSubheadline: "Concept → Practice → Doubt Resolution → Test → Improvement",
  heroCtaText: "Enquire Now",
  heroCtaTarget: "/admissions",
  feeDisplayEnabled: true,
  admissionsOpen: true,
  resourcesEnabled: true,
  resourcesSearchEnabled: true,
};

async function getOrCreateSingleton() {
  let settings = await db.siteSettings.findFirst();
  if (!settings) {
    settings = await db.siteSettings.create({
      data: {
        ...DEFAULT_SETTINGS,
        socialLinks: DEFAULT_SETTINGS.socialLinks,
      } as Prisma.SiteSettingsCreateInput,
    });
  }
  return settings;
}

export const getSiteSettings = cache(async function getSiteSettings(): Promise<
  ServiceResult<SiteSettingsData>
> {
  try {
    const settings = await getOrCreateSingleton();
    return success({
      ...settings,
      socialLinks: (settings.socialLinks as Record<string, string> | null) ?? null,
    });
  } catch {
    return failure("INTERNAL_ERROR", "Failed to fetch site settings");
  }
});

export async function updateSiteSettings(
  actor: ActorContext,
  input: Record<string, unknown>,
): Promise<ServiceResult<SiteSettingsData>> {
  try {
    const existing = await getOrCreateSingleton();

    const updateData: Record<string, unknown> = { updatedBy: actor.userId };
    const changedFields: string[] = [];

    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) {
        updateData[key] = value;
        changedFields.push(key);
      }
    }

    if (Object.keys(updateData).length === 1) {
      // Only updatedBy was set
      const existingSettings = await getOrCreateSingleton();
      return success({
        ...existingSettings,
        socialLinks:
          (existingSettings.socialLinks as Record<string, string> | null) ?? null,
      });
    }

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.siteSettings.update({
        where: { id: existing.id },
        data: updateData as Prisma.SiteSettingsUpdateInput,
      });

      await createAuditLog(tx, actor, {
        action: "SITE_SETTINGS_UPDATE",
        entityType: "SiteSettings",
        entityId: existing.id,
        summary: `Updated site settings: ${Object.keys(updateData)
          .filter((k) => k !== "updatedBy")
          .join(", ")}`,
        metadata: {
          updatedFields: Object.keys(updateData).filter((k) => k !== "updatedBy"),
        },
      });

      return result;
    });

    return success({
      ...updated,
      socialLinks: (updated.socialLinks as Record<string, string> | null) ?? null,
    });
  } catch (error) {
    console.error("updateSiteSettings error:", error);
    if (error instanceof DomainError) return failure(error.code, error.message);
    return failure("INTERNAL_ERROR", "Failed to update site settings");
  }
}
