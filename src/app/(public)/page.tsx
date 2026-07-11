import { getPublicHomeData } from "@/server/services/public";
import { HeroSection } from "@/features/public/components/HeroSection";
import { TeacherIntro } from "@/features/public/components/TeacherIntro";

export default async function HomePage() {
  const data = await getPublicHomeData();

  return (
    <div className="space-y-0">
      <HeroSection settings={data.siteSettings} />
      <TeacherIntro teacher={data.teacher} />
    </div>
  );
}
