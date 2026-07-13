import { Metadata } from "next";
import { BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";
import { getPublicCourses } from "@/server/services/public-courses";
import { CourseGroup } from "@/features/public/components/CourseGroup";
import { TeacherIntro } from "@/features/public/components/TeacherIntro";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Courses | Study Point Mathematics",
  description:
    "Mathematics coaching for Classes IX-XII across CBSE and CISCE boards. Structured curriculum, expert faculty, and proven results.",
  alternates: { canonical: "/courses" },
  openGraph: { url: "/courses" },
};

export default async function CoursesPage() {
  const data = await getPublicCourses();

  return (
    <div className="space-y-0">
      <section className="py-12 md:py-20 bg-muted/30" aria-labelledby="courses-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="text-center mb-12 max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-glow mb-2">
              Our Courses
            </p>
            <h1
              id="courses-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-heading tracking-tight text-foreground mb-4"
            >
              Mathematics Courses for Classes IX–XII
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Structured curriculum aligned with CBSE and CISCE boards. Expert faculty,
              concept-driven methodology, and regular assessments ensure mastery.
            </p>
          </header>

          {data.groups.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="mx-auto size-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Courses Available
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                We don&apos;t have any active course batches at the moment. Please check
                back later or contact us for updates.
              </p>
            </div>
          ) : (
            <>
              {data.groups.map((boardEntry) => (
                <CourseGroup
                  key={boardEntry.board.id}
                  board={boardEntry.board}
                  programmes={boardEntry.programmes}
                />
              ))}

              <div className="mt-16 text-center">
                <Link
                  href="/admissions"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:shadow-lg"
                >
                  Enquire About Admissions
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <TeacherIntro teacher={null} />
    </div>
  );
}
