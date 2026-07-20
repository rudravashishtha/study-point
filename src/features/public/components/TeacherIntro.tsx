"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useMemo } from "react";

type TeacherType = {
  id: string;
  fullName: string;
  qualifications: string | null;
  photoFileId: string | null;
  bio: string | null;
  subjects: string[];
};

interface TeacherIntroProps {
  teachers: TeacherType[];
}

export function TeacherIntro({ teachers }: TeacherIntroProps) {
  if (!teachers || teachers.length === 0) return null;

  if (teachers.length === 1) {
    return <SingleTeacherCard teacher={teachers[0]} />;
  }

  return <MultiTeacherCarousel teachers={teachers} />;
}

function MultiTeacherCarousel({ teachers }: { teachers: TeacherType[] }) {
  const plugin = useMemo(
    () => Autoplay({ delay: 6000, stopOnInteraction: true }),
    [],
  );

  return (
    <section className="relative overflow-hidden py-24 md:py-32" aria-labelledby="teacher-carousel-heading">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
            Meet Your Mentors
          </p>
          <h2
            id="teacher-carousel-heading"
            className="text-3xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-tight"
          >
            Guidance that goes beyond the syllabus.
          </h2>
        </div>

        <Carousel
          opts={{ loop: true, align: "center" }}
          plugins={[plugin]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {teachers.map((teacher) => (
              <CarouselItem key={teacher.id}>
                <div className="p-2 md:p-6">
                  <div className="flex flex-col items-center text-center space-y-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-8 md:p-12 shadow-xl">
                    {teacher.photoFileId ? (
                      <div className="relative size-40 md:size-56 rounded-full overflow-hidden shadow-xl border border-border/40">
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-xs text-center px-4">Teacher Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative size-40 md:size-56 rounded-full overflow-hidden shadow-xl border border-border/40 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
                        <svg
                          className="size-16 text-muted-foreground/30"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold font-heading text-foreground">
                        {teacher.fullName}
                      </h3>
                      {teacher.qualifications && (
                        <p className="text-sm text-primary font-medium">
                          {teacher.qualifications}
                        </p>
                      )}
                    </div>

                    <div className="prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                      <p>
                        {teacher.bio ??
                          "True learning happens when students feel supported, understood, and encouraged. My approach focuses on building unshakeable conceptual foundations in a stress-free environment, empowering you to unlock your full potential and achieve results you can be proud of."}
                      </p>
                    </div>

                    <div className="space-y-4 w-full">
                      <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Subjects</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {teacher.subjects.length > 0 ? teacher.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted/50 border border-border text-foreground transition-colors hover:bg-muted"
                          >
                            {subject}
                          </span>
                        )) : (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted/50 border border-border text-foreground">
                            All Core Subjects
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex">
            <CarouselPrevious className="-left-12 size-12 border-white/10 bg-card/50 hover:bg-card" />
            <CarouselNext className="-right-12 size-12 border-white/10 bg-card/50 hover:bg-card" />
          </div>
        </Carousel>

        <div className="mt-16 flex justify-center">
          <Link
            href="/admissions"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
          >
            Join Our Classes
            <ChevronRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SingleTeacherCard({ teacher }: { teacher: TeacherType }) {
  return (
    <section className="relative overflow-hidden py-24 md:py-32" aria-labelledby="teacher-heading">
      {/* Soft Background Accent */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/3 h-2/3 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Portrait Column (Asymmetrical layout) */}
          {teacher.photoFileId && (
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="w-full lg:w-5/12 relative"
            >
              <div className="relative aspect-[4/5] w-full max-w-md mx-auto lg:mx-0 rounded-[2.5rem] overflow-hidden shadow-2xl border border-border/40">
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">Teacher Photo</span>
                </div>
                {/* Soft overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
              </div>

              {/* Floating Info Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -bottom-6 -right-4 lg:-right-12 bg-card/80 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl p-6 w-64"
              >
                <h3 className="text-xl font-bold font-heading text-foreground">
                  {teacher.fullName}
                </h3>
                {teacher.qualifications && (
                  <p className="text-sm text-primary font-medium mt-1">
                    {teacher.qualifications}
                  </p>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Content Column */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className={cn(
              "w-full space-y-8 mt-12 lg:mt-0",
              teacher.photoFileId ? "lg:w-7/12" : "lg:max-w-4xl lg:mx-auto text-center"
            )}
          >
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">
                Meet Your Mentor
              </p>
              {!teacher.photoFileId && (
                <h3 className="text-2xl font-bold font-heading text-foreground mb-4">
                  {teacher.fullName}
                  {teacher.qualifications && (
                    <span className="text-muted-foreground font-normal ml-2 text-lg">
                      — {teacher.qualifications}
                    </span>
                  )}
                </h3>
              )}
              <h2
                id="teacher-heading"
                className={cn(
                  "text-3xl md:text-5xl font-bold font-heading tracking-tight text-foreground leading-tight",
                  !teacher.photoFileId && "mx-auto max-w-3xl"
                )}
              >
                Guidance that goes beyond the syllabus.
              </h2>
            </div>

            <div className={cn("prose prose-lg dark:prose-invert text-muted-foreground leading-relaxed", !teacher.photoFileId && "mx-auto")}>
              <p>
                {teacher.bio ??
                  "True learning happens when students feel supported, understood, and encouraged. My approach focuses on building unshakeable conceptual foundations in a stress-free environment, empowering you to unlock your full potential and achieve results you can be proud of."}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Subjects</h3>
              <div className={cn("flex flex-wrap gap-2", !teacher.photoFileId && "justify-center")}>
                {teacher.subjects.length > 0 ? teacher.subjects.map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted/50 border border-border text-foreground transition-colors hover:bg-muted"
                  >
                    {subject}
                  </span>
                )) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-muted/50 border border-border text-foreground">
                    All Core Subjects
                  </span>
                )}
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/admissions"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:-translate-y-0.5"
              >
                Join Our Classes
                <ChevronRight className="size-5" aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
