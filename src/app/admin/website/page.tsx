import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { WebsiteContentClient } from "./components/WebsiteContentClient";

export default async function AdminWebsitePage() {
  await requireAdmin();

  const [
    whyChooseUsItems,
    methodologySteps,
    testimonials,
    galleryItems,
    faqs,
    performanceMetrics,
    sections,
  ] = await Promise.all([
    db.whyChooseUsItem.findMany({ orderBy: { displayOrder: "asc" } }),
    db.methodologyStep.findMany({ orderBy: { displayOrder: "asc" } }),
    db.testimonial.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        studentPhoto: { select: { id: true, storageKey: true, bucket: true, mimeType: true } },
      },
    }),
    db.galleryItem.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        fileAsset: { select: { id: true, storageKey: true, bucket: true, mimeType: true } },
      },
    }),
    db.fAQ.findMany({ orderBy: { displayOrder: "asc" } }),
    db.performanceMetric.findMany({ orderBy: { displayOrder: "asc" } }),
    db.homepageSection.findMany({ orderBy: { displayOrder: "asc" } }),
  ]);

  return (
    <WebsiteContentClient
      whyChooseUsItems={whyChooseUsItems}
      methodologySteps={methodologySteps}
      testimonials={testimonials}
      galleryItems={galleryItems}
      faqs={faqs}
      performanceMetrics={performanceMetrics}
      sections={sections}
    />
  );
}
