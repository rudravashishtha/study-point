"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

const classes = [
  {
    id: 9,
    name: "Class IX",
    focus: "Establishing Algebraic & Geometric Foundations",
    cbse: true,
    cisce: true,
  },
  {
    id: 10,
    name: "Class X",
    focus: "Board Examination Mastery & Trigonometry Intro",
    cbse: true,
    cisce: true,
  },
  {
    id: 11,
    name: "Class XI",
    focus: "Calculus, Conic Sections & Advanced Algebra",
    cbse: true,
    cisce: true,
  },
  {
    id: 12,
    name: "Class XII",
    focus: "Senior Board Excellence & Complex Mathematics",
    cbse: true,
    cisce: true,
  },
];

export function CurriculumProgression() {
  const [activeClass, setActiveClass] = useState<number | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
      <div className="mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold font-heading mb-6">
          Curriculum Tracks
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl">
          An intentional, four-year mathematical journey designed to build compound
          understanding from middle school to senior boards.
        </p>
      </div>

      <div className="relative border-l-2 border-border/50 ml-4 md:ml-0 md:border-l-0 md:flex md:flex-row md:gap-4 md:h-[400px]">
        {/* Mobile vertical line */}

        {classes.map((cls) => {
          const isActive = activeClass === cls.id;

          return (
            <motion.div
              key={cls.id}
              className={`relative mb-8 md:mb-0 pl-8 md:pl-0 flex-1 flex flex-col md:border-t-2 ${isActive ? "md:border-brand-glow" : "md:border-border/50"} transition-colors duration-500 cursor-pointer group`}
              onMouseEnter={() => setActiveClass(cls.id)}
              onMouseLeave={() => setActiveClass(null)}
              layout
            >
              {/* Timeline dot */}
              <div
                className={`absolute left-[-9px] md:left-0 md:-top-[9px] w-4 h-4 rounded-full border-2 bg-surface transition-colors duration-300 ${isActive ? "border-brand-glow bg-brand-glow/20 shadow-[0_0_10px_rgba(var(--brand-glow),0.5)]" : "border-border/50 group-hover:border-brand-glow/50"}`}
              />

              <div
                className={`pt-2 md:pt-8 pr-4 transition-opacity duration-300 ${activeClass && !isActive ? "opacity-40" : "opacity-100"}`}
              >
                <h3 className="text-3xl font-bold font-heading mb-3">{cls.name}</h3>

                <div className="flex gap-2 mb-6">
                  {cls.cbse && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-elevated border border-border/50 text-foreground">
                      CBSE
                    </span>
                  )}
                  {cls.cisce && (
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-surface-elevated border border-border/50 text-foreground">
                      CISCE (ICSE/ISC)
                    </span>
                  )}
                </div>

                <motion.div
                  initial={false}
                  animate={{
                    height: isActive ? "auto" : "0px",
                    opacity: isActive ? 1 : 0,
                  }}
                  className="overflow-hidden md:h-auto md:opacity-100"
                >
                  <p className="text-muted-foreground font-medium mb-4">{cls.focus}</p>
                  <button className="flex items-center gap-1 text-sm font-bold text-brand-glow hover:text-brand-glow/80 transition-colors">
                    View syllabus <ChevronRight className="size-4" />
                  </button>
                </motion.div>

                {/* Desktop static text if not interacting to prevent layout shift */}
                <div
                  className={`hidden md:block mt-4 transition-all duration-300 ${isActive ? "opacity-0 h-0 pointer-events-none" : "opacity-100 h-auto"}`}
                >
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {cls.focus}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
