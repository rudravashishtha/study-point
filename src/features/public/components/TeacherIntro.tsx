"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface TeacherIntroProps {
  teacher: {
    id: string;
    fullName: string;
    qualifications: string | null;
    photoFileId: string | null;
    bio: string | null;
    subjects: string[];
  } | null;
}

export function TeacherIntro({ teacher }: TeacherIntroProps) {
  if (!teacher) return null;

  return (
    <section className="py-16 md:py-24 bg-muted/30" aria-labelledby="teacher-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2
            id="teacher-heading"
            className="text-3xl md:text-4xl font-bold font-heading tracking-tight text-foreground mb-4"
          >
            Meet Your Teacher
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn from an experienced educator who makes complex concepts accessible.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <div className="aspect-square w-full max-w-xs mx-auto md:mx-0 rounded-2xl overflow-hidden bg-muted border border-border/50">
              {teacher.photoFileId ? (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Teacher Photo</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <svg
                    className="size-16 text-muted-foreground/50 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold font-heading text-foreground">
                {teacher.fullName}
              </h3>
              {teacher.qualifications && (
                <p className="text-sm text-muted-foreground mt-1">
                  {teacher.qualifications}
                </p>
              )}
              {teacher.subjects.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {teacher.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-3">
                Teaching Philosophy
              </h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {teacher.bio ??
                  "Every student can excel in mathematics with the right guidance. My approach focuses on building strong conceptual foundations, followed by extensive practice and targeted doubt resolution."}
              </p>
            </div>

            {teacher.qualifications && (
              <div>
                <h3 className="text-xl font-bold font-heading text-foreground mb-3">
                  Qualifications
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {teacher.qualifications}
                </p>
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold font-heading text-foreground mb-3">
                Subjects Taught
              </h3>
              <div className="flex flex-wrap gap-2">
                {teacher.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 hover:shadow-md"
              >
                Join a Class
                <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
