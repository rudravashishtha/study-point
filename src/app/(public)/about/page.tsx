import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, GraduationCap, Target, Lightbulb, Users } from "lucide-react";
import { getSiteSettings } from "@/server/services/site-settings";
import { getPublicTeacherProfile } from "@/server/services/public";
import { TeacherIntro } from "@/features/public/components/TeacherIntro";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About | Study Point Mathematics",
  description:
    "Learn about Study Point Mathematics — the teacher, the teaching philosophy, and why students trust us for Classes IX to XII.",
};

const APPROACH = [
  {
    icon: Lightbulb,
    title: "Concept First",
    description:
      "We build a clear, intuitive understanding of each idea before moving to problem solving, so methods are never memorised blindly.",
  },
  {
    icon: Target,
    title: "Structured Practice",
    description:
      "Every concept is reinforced with graded practice — from fundamentals to board and competitive-level questions.",
  },
  {
    icon: Users,
    title: "Doubt Resolution",
    description:
      "No question is too small. Regular doubt sessions ensure gaps are closed before they become roadblocks.",
  },
  {
    icon: GraduationCap,
    title: "Test & Improve",
    description:
      "Chapter and full-syllabus tests track real progress, and feedback drives the next cycle of learning.",
  },
];

export default async function AboutPage() {
  const [settingsResult, teacher] = await Promise.all([
    getSiteSettings(),
    getPublicTeacherProfile(),
  ]);
  const settings = settingsResult.success ? settingsResult.data : null;
  const instituteName = settings?.instituteName ?? "Study Point Mathematics";

  return (
    <main>
      <section className="bg-gradient-to-b from-brand/5 to-transparent py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              About Us
            </p>
            <h1 className="mt-3 text-4xl font-bold font-heading tracking-tight text-foreground md:text-5xl">
              The people and principles behind {instituteName}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              A focused mathematics coaching institute for Classes IX to XII, built on
              clear teaching, consistent practice, and genuine care for every
              student&rsquo;s progress.
            </p>
          </div>
        </div>
      </section>

      <TeacherIntro teacher={teacher} />

      <section className="py-16 md:py-24" aria-labelledby="approach-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="approach-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
            >
              How we teach
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A simple, repeatable method that has helped students gain confidence and
              results in mathematics.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {APPROACH.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/60 bg-surface-elevated bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold font-heading text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl">
              Ready to join a class?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore the admission process, class timings, and fee information, or reach
              out with your questions.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:shadow-md"
              >
                Admissions
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-surface-elevated bg-card px-6 py-3 text-base font-semibold text-foreground transition-colors hover:border-brand-glow/30"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
