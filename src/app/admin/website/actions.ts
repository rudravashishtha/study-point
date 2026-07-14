"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { withActor, withAuthorization } from "@/lib/actions/wrappers";
import { sanitizeRichText } from "@/lib/sanitize";
import { createAuditLog } from "@/lib/domain/audit";
import { DomainError } from "@/lib/domain/errors";

// ── HomepageSection ──

const LOCKED_HIDE_SECTIONS = ["hero", "contact"];

export const updateHomepageSectionAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      sectionKey: string,
      data: { isVisible?: boolean; title?: string | null },
    ) => {
      if (data.isVisible === false && LOCKED_HIDE_SECTIONS.includes(sectionKey)) {
        throw new DomainError(
          "VALIDATION",
          `The "${sectionKey}" section is locked and cannot be hidden.`,
        );
      }
      await db.homepageSection.upsert({
        where: { sectionKey },
        update: { ...data, updatedBy: actor.userId },
        create: { sectionKey, ...data, updatedBy: actor.userId },
      });
      await createAuditLog(db, actor, {
        action: "HOMEPAGE_SECTION_UPDATE",
        entityType: "HomepageSection",
        entityId: sectionKey,
        summary: `Updated homepage section: ${sectionKey}`,
      });
      revalidatePath("/");
      revalidatePath("/admin/website");
      return { success: true as const, data: undefined };
    },
  ),
);

export const reorderHomepageSectionAction = withActor(
  withAuthorization(
    "ADMIN",
    async (actor, sectionKey: string, newDisplayOrder: number) => {
      const section = await db.homepageSection.findUnique({ where: { sectionKey } });
      if (!section) {
        throw new DomainError("NOT_FOUND", "Homepage section not found.");
      }
      if (sectionKey === "hero" && newDisplayOrder !== 1) {
        throw new DomainError(
          "VALIDATION",
          "The Hero section must remain in the first position.",
        );
      }
      if (sectionKey === "contact" && newDisplayOrder < 11) {
        throw new DomainError(
          "VALIDATION",
          "The Contact section must remain in the CTA area (last positions).",
        );
      }
      await db.homepageSection.update({
        where: { sectionKey },
        data: { displayOrder: newDisplayOrder, updatedBy: actor.userId },
      });
      await createAuditLog(db, actor, {
        action: "HOMEPAGE_SECTION_REORDER",
        entityType: "HomepageSection",
        entityId: sectionKey,
        summary: `Reordered homepage section "${sectionKey}" to position ${newDisplayOrder}`,
      });
      revalidatePath("/");
      revalidatePath("/admin/website");
      return { success: true as const, data: undefined };
    },
  ),
);

// ── WhyChooseUsItem ──

export const createWhyChooseUsItemAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      data: { title: string; description: string; iconName?: string | null },
    ) => {
      await db.whyChooseUsItem.create({
        data: { ...data, description: sanitizeRichText(data.description) },
      });
      await createAuditLog(db, actor, {
        action: "WHY_CHOOSE_US_CREATE",
        entityType: "WhyChooseUsItem",
        summary: `Created Why Choose Us item: ${data.title}`,
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const updateWhyChooseUsItemAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      id: string,
      data: Partial<{
        title: string;
        description: string;
        iconName: string | null;
        isPublished: boolean;
        displayOrder: number;
      }>,
    ) => {
      await db.whyChooseUsItem.update({
        where: { id },
        data: {
          ...data,
          description:
            data.description !== undefined
              ? sanitizeRichText(data.description)
              : undefined,
        },
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const deleteWhyChooseUsItemAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.whyChooseUsItem.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

// ── MethodologyStep ──

export const createMethodologyStepAction = withActor(
  withAuthorization(
    "ADMIN",
    async (actor, data: { title: string; description: string; stepNumber: number }) => {
      await db.methodologyStep.create({
        data: { ...data, description: sanitizeRichText(data.description) },
      });
      createAuditLog(db, actor, {
        action: "METHODOLOGY_STEP_CREATE",
        entityType: "MethodologyStep",
        summary: `Created methodology step: ${data.title}`,
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const updateMethodologyStepAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      id: string,
      data: Partial<{
        title: string;
        description: string;
        stepNumber: number;
        isPublished: boolean;
        displayOrder: number;
      }>,
    ) => {
      await db.methodologyStep.update({
        where: { id },
        data: {
          ...data,
          description:
            data.description !== undefined
              ? sanitizeRichText(data.description)
              : undefined,
        },
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const deleteMethodologyStepAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.methodologyStep.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

// ── Testimonial ──

export const createTestimonialAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      data: {
        studentName: string;
        message: string;
        designation?: string | null;
        studentClass?: string | null;
        batch?: string | null;
        year?: number | null;
        studentPhotoFileId?: string | null;
        featured?: boolean;
        displayOrder?: number;
      },
    ) => {
      await db.testimonial.create({
        data: { ...data, studentClass: data.studentClass as any },
      });
      createAuditLog(db, actor, {
        action: "TESTIMONIAL_CREATE",
        entityType: "Testimonial",
        summary: `Created testimonial: ${data.studentName}`,
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const updateTestimonialAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string, data: Record<string, unknown>) => {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === null) clean[k] = null;
      else if (v !== undefined) clean[k] = v;
    }
    await db.testimonial.update({ where: { id }, data: clean as any });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

export const deleteTestimonialAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.testimonial.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

// ── GalleryItem ──

export const createGalleryItemAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      data: {
        fileAssetId: string;
        caption?: string | null;
        category?: string | null;
        displayOrder?: number;
      },
    ) => {
      await db.galleryItem.create({ data });
      createAuditLog(db, actor, {
        action: "GALLERY_ITEM_CREATE",
        entityType: "GalleryItem",
        summary: "Created gallery item",
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const updateGalleryItemAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      id: string,
      data: Partial<{
        caption: string | null;
        category: string | null;
        isPublished: boolean;
        displayOrder: number;
      }>,
    ) => {
      await db.galleryItem.update({ where: { id }, data });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const deleteGalleryItemAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.galleryItem.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

// ── FAQ ──

export const createFAQAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      data: { question: string; answer: string; category?: string | null },
    ) => {
      await db.fAQ.create({ data: { ...data, answer: sanitizeRichText(data.answer) } });
      createAuditLog(db, actor, {
        action: "FAQ_CREATE",
        entityType: "FAQ",
        summary: `Created FAQ: ${data.question.substring(0, 60)}`,
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const updateFAQAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      id: string,
      data: Partial<{
        question: string;
        answer: string;
        category: string | null;
        isPublished: boolean;
        displayOrder: number;
      }>,
    ) => {
      await db.fAQ.update({
        where: { id },
        data: {
          ...data,
          answer: data.answer !== undefined ? sanitizeRichText(data.answer) : undefined,
        },
      });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const deleteFAQAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.fAQ.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

// ── PerformanceMetric ──

export const createPerformanceMetricAction = withActor(
  withAuthorization("ADMIN", async (actor, data: { label: string; value: string }) => {
    await db.performanceMetric.create({ data });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);

export const updatePerformanceMetricAction = withActor(
  withAuthorization(
    "ADMIN",
    async (
      actor,
      id: string,
      data: Partial<{
        label: string;
        value: string;
        isPublished: boolean;
        displayOrder: number;
      }>,
    ) => {
      await db.performanceMetric.update({ where: { id }, data });
      revalidatePath("/admin/website");
      revalidatePath("/");
      return { success: true as const, data: undefined };
    },
  ),
);

export const deletePerformanceMetricAction = withActor(
  withAuthorization("ADMIN", async (actor, id: string) => {
    await db.performanceMetric.delete({ where: { id } });
    revalidatePath("/admin/website");
    revalidatePath("/");
    return { success: true as const, data: undefined };
  }),
);
