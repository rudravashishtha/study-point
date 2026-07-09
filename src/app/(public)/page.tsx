import { HeroEnvironment } from "./hero-environment";
import { TeachingSequence } from "./teaching-sequence";
import { CurriculumProgression } from "./curriculum-progression";
import { TeacherSection } from "./teacher-section";
import { CTASection } from "./cta-section";

export default function HomePage() {
  return (
    <div className="w-full flex flex-col relative">
      <HeroEnvironment />
      <TeachingSequence />
      <TeacherSection />
      <CurriculumProgression />
      <CTASection />
    </div>
  );
}
