import { db } from "../../lib/db";
import { sanitizeRichText } from "../../lib/sanitize";

type ClassLevel = "IX" | "X" | "XI" | "XII";

export async function listWhyChooseUsItems() {
  return db.whyChooseUsItem.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listPublishedWhyChooseUsItems() {
  return db.whyChooseUsItem.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function listMethodologySteps() {
  return db.methodologyStep.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listPublishedMethodologySteps() {
  return db.methodologyStep.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function listTestimonials() {
  return db.testimonial.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listPublishedTestimonials() {
  return db.testimonial.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
    include: {
      studentPhoto: {
        select: { storageKey: true, bucket: true, mimeType: true },
      },
    },
  });
}

export async function listGalleryItems() {
  return db.galleryItem.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      fileAsset: { select: { storageKey: true, bucket: true, mimeType: true } },
    },
  });
}

export async function listPublishedGalleryItems() {
  return db.galleryItem.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
    include: {
      fileAsset: { select: { storageKey: true, bucket: true, mimeType: true } },
    },
  });
}

export async function listFAQs() {
  return db.fAQ.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listPublishedFAQs() {
  return db.fAQ.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function listPerformanceMetrics() {
  return db.performanceMetric.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listPublishedPerformanceMetrics() {
  return db.performanceMetric.findMany({
    where: { isPublished: true },
    orderBy: { displayOrder: "asc" },
  });
}

export async function getHomepageSections() {
  return db.homepageSection.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function listFeaturedResources() {
  return db.studyMaterial.findMany({
    where: {
      lifecycleState: "PUBLISHED",
      visibility: "CURRICULUM_TRACK",
      featured: true,
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      description: true,
      resourceType: true,
      publishedAt: true,
      externalLinkUrl: true,
      fileAssetId: true,
      fileAsset: { select: { storageKey: true, bucket: true, mimeType: true } },
    },
  });
}

export interface PublicWebsiteData {
  whyChooseUs: Array<{
    id: string;
    title: string;
    description: string;
    iconName: string | null;
  }>;
  methodologySteps: Array<{
    id: string;
    title: string;
    description: string;
    stepNumber: number;
  }>;
  testimonials: Array<{
    id: string;
    studentName: string;
    designation: string | null;
    studentClass: ClassLevel | null;
    message: string;
    photoUrl: string | null;
  }>;
  galleryItems: Array<{
    id: string;
    caption: string | null;
    category: string | null;
    fileUrl: string | null;
    mimeType: string;
  }>;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
    category: string | null;
  }>;
  performanceMetrics: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  sections: Array<{
    id: string;
    sectionKey: string;
    isVisible: boolean;
    title: string | null;
  }>;
  featuredResources: Array<{
    id: string;
    title: string;
    description: string | null;
    resourceType: string;
    fileUrl: string | null;
  }>;
}

export async function getPublicWebsiteData(): Promise<PublicWebsiteData> {
  const [
    whyChooseUs,
    methodologySteps,
    testimonials,
    galleryItems,
    faqs,
    performanceMetrics,
    sections,
    featuredResources,
  ] = await Promise.all([
    listPublishedWhyChooseUsItems(),
    listPublishedMethodologySteps(),
    listPublishedTestimonials(),
    listPublishedGalleryItems(),
    listPublishedFAQs(),
    listPublishedPerformanceMetrics(),
    getHomepageSections(),
    listFeaturedResources(),
  ]);

  return {
    whyChooseUs: whyChooseUs.map((w) => ({
      id: w.id,
      title: w.title,
      description: sanitizeRichText(w.description),
      iconName: w.iconName,
    })),
    methodologySteps: methodologySteps.map((m) => ({
      id: m.id,
      title: m.title,
      description: sanitizeRichText(m.description),
      stepNumber: m.stepNumber,
    })),
    testimonials: testimonials.map((t) => ({
      id: t.id,
      studentName: t.studentName,
      designation: t.designation,
      studentClass: t.studentClass as ClassLevel | null,
      message: t.message,
      photoUrl: t.studentPhoto
        ? `${t.studentPhoto.bucket}/${t.studentPhoto.storageKey}`
        : null,
    })),
    galleryItems: galleryItems.map((g) => ({
      id: g.id,
      caption: g.caption,
      category: g.category,
      fileUrl: g.fileAsset ? `${g.fileAsset.bucket}/${g.fileAsset.storageKey}` : null,
      mimeType: g.fileAsset.mimeType,
    })),
    faqs: faqs.map((f) => ({
      id: f.id,
      question: f.question,
      answer: sanitizeRichText(f.answer),
      category: f.category,
    })),
    performanceMetrics: performanceMetrics.map((p) => ({
      id: p.id,
      label: p.label,
      value: p.value,
    })),
    sections: sections.map((s) => ({
      id: s.id,
      sectionKey: s.sectionKey,
      isVisible: s.isVisible,
      title: s.title,
    })),
    featuredResources: featuredResources.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      resourceType: r.resourceType,
      fileUrl: r.fileAsset ? `${r.fileAsset.bucket}/${r.fileAsset.storageKey}` : null,
    })),
  };
}
