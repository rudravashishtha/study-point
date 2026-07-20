import type { Metadata } from "next";
import { getPublicHomeData } from "@/server/services/public";
import { getPublicWebsiteData } from "@/server/services/website-content";
import { getSiteSettings } from "@/server/services/site-settings";
import { HeroSection } from "@/features/public/components/HeroSection";
import { TeacherIntro } from "@/features/public/components/TeacherIntro";
import { WhyChooseUsSection } from "@/features/public/components/homepage/WhyChooseUsSection";
import { MethodologySection } from "@/features/public/components/homepage/MethodologySection";
import { TestimonialsSection } from "@/features/public/components/homepage/TestimonialsSection";
import { MetricsSection } from "@/features/public/components/homepage/MetricsSection";
import { GallerySection } from "@/features/public/components/homepage/GallerySection";
import { FeaturedResourcesSection } from "@/features/public/components/homepage/FeaturedResourcesSection";
import { CurrentBatchesSection } from "@/features/public/components/homepage/CurrentBatchesSection";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Study Point — Coaching for Classes IX-XII",
  description:
    "Premium coaching for Classes IX-XII (CBSE & CISCE). Concept-driven teaching, expert faculty, small batches, and proven results.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function HomePage() {
  const data = await getPublicHomeData();
  const website = await getPublicWebsiteData();
  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  const sectionMap = new Map(
    website.sections.map((s) => [
      s.sectionKey,
      { isVisible: s.isVisible, title: s.title },
    ]),
  );

  const getSection = (key: string) =>
    sectionMap.get(key) ?? { isVisible: true, title: null };

  return (
    <div className="space-y-0">
      <HeroSection settings={data.siteSettings} />
      <TeacherIntro teachers={data.teachers} />
      <WhyChooseUsSection
        items={website.whyChooseUs}
        isVisible={getSection("why-choose-us").isVisible}
        title={getSection("why-choose-us").title}
      />
      <MethodologySection
        steps={website.methodologySteps}
        isVisible={getSection("methodology").isVisible}
        title={getSection("methodology").title}
      />
      <TestimonialsSection
        testimonials={website.testimonials}
        isVisible={getSection("testimonials").isVisible}
        title={getSection("testimonials").title}
      />
      <MetricsSection
        metrics={website.performanceMetrics}
        isVisible={getSection("performance-metrics").isVisible}
      />
      <GallerySection
        items={website.galleryItems}
        isVisible={getSection("gallery").isVisible}
        title={getSection("gallery").title}
      />
      <CurrentBatchesSection
        batches={data.batches}
        isVisible={settings?.admissionsOpen ?? true}
      />
      <FeaturedResourcesSection
        resources={website.featuredResources}
        isVisible={getSection("featured-resources").isVisible}
        isEnabled={settings?.resourcesEnabled ?? true}
      />
    </div>
  );
}
