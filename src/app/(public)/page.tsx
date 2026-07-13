import type { Metadata } from "next";
import { getPublicHomeData } from "@/server/services/public";
import { HeroSection } from "@/features/public/components/HeroSection";
import { TeacherIntro } from "@/features/public/components/TeacherIntro";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Study Point — Mathematics Coaching for Classes IX–XII",
  description:
    "Premium mathematics coaching for Classes IX–XII (CBSE & CISCE). Concept-driven teaching, expert faculty, small batches, and proven results.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default async function HomePage() {
  const data = await getPublicHomeData();

  return (
    <div className="space-y-0">
      <HeroSection settings={data.siteSettings} />
      <TeacherIntro teacher={data.teacher} />
    </div>
  );
}
