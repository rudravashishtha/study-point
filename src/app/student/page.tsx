"use client";

import { BookOpen, CalendarClock, ChevronRight, Compass } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Welcome & Next Action Surface */}
      <section className="relative rounded-3xl overflow-hidden bg-surface-elevated border border-border/60 shadow-xl p-8 sm:p-12">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <path
              d="M 0 100 Q 100 50 200 100 T 400 100"
              fill="none"
              stroke="var(--color-brand-glow)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <circle cx="200" cy="100" r="4" fill="var(--color-brand-glow)" />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-glow/10 to-transparent" />
        </div>

        <div className="relative z-10 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold font-heading mb-2">
              Welcome back.
            </h2>
            <p className="text-muted-foreground font-medium mb-8">
              Your command centre is ready.
            </p>

            {/* Primary Action (Empty State) */}
            <div className="inline-block">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-glow mb-2">
                Next Action
              </p>
              <div className="group flex items-center gap-4 bg-surface/80 backdrop-blur-sm border border-border/60 text-foreground px-6 py-4 rounded-2xl shadow-sm">
                <div className="bg-surface-interactive p-2 rounded-xl border border-border/50">
                  <Compass className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-muted-foreground">
                    No immediate actions
                  </h3>
                  <p className="text-xs opacity-70">Your next action will appear here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex justify-end">
            {/* Timeline Placeholder (Empty State) */}
            <div className="relative border-l-2 border-border/30 pl-6 py-2 space-y-6">
              <div className="relative opacity-60">
                <div className="absolute -left-[29px] top-1.5 size-3 rounded-full border-2 border-border/40 bg-surface" />
                <p className="text-sm font-bold text-muted-foreground">Schedule clear</p>
                <p className="text-xs text-muted-foreground/70">
                  Upcoming classes will appear here
                </p>
              </div>
              <div className="relative opacity-40">
                <div className="absolute -left-[29px] top-1.5 size-3 rounded-full border-2 border-border/30 bg-surface" />
                <p className="text-sm font-bold text-muted-foreground">
                  No pending tasks
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Deadlines will appear here
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Study Materials (Empty State) */}
        <section className="rounded-3xl bg-surface-elevated border border-border/40 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold font-heading text-xl flex items-center gap-2">
              <BookOpen className="size-5 text-brand-glow" /> Recent Materials
            </h3>
            <Link
              href="/student/course"
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center"
            >
              View all <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-60">
            <div className="size-10 rounded-full border border-dashed border-border/60 flex items-center justify-center mb-3 bg-surface/50">
              <BookOpen className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold mb-1">No materials yet</p>
            <p className="text-xs text-muted-foreground">
              Materials shared with you will appear here
            </p>
          </div>
        </section>

        {/* Schedule / Timeline (Empty State) */}
        <section className="rounded-3xl bg-surface-elevated border border-border/40 p-6 sm:p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold font-heading text-xl flex items-center gap-2">
              <CalendarClock className="size-5 text-brand-glow" /> Upcoming Schedule
            </h3>
            <Link
              href="/student/timetable"
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center"
            >
              Full schedule <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-60">
            <div className="size-10 rounded-full border border-dashed border-border/60 flex items-center justify-center mb-3 bg-surface/50">
              <CalendarClock className="size-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold mb-1">No upcoming class scheduled</p>
            <p className="text-xs text-muted-foreground">
              Upcoming classes and deadlines will appear here
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
