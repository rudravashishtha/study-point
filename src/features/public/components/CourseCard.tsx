"use client";

import Link from "next/link";
import { BookOpen, Users, Clock, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  track: {
    id: string;
    displayName: string;
    classLevel: string;
    subject: { name: string };
    board?: { code: string; name: string } | null;
  };
  batches: Array<{
    id: string;
    name: string;
    feePlan?: {
      id: string;
      name: string;
      assignedTotalAmount: number | null;
      showPublicly: boolean;
    } | null;
  }>;
  showFees: boolean;
}

export function CourseCard({ track, batches, showFees }: CourseCardProps) {
  const subjectName = track.subject?.name ?? "Mathematics";
  const classLevel = track.classLevel ?? "Class";
  const displayName = track.displayName ?? `${classLevel} ${subjectName}`;

  const activeBatches = batches.filter((b) => b.feePlan?.showPublicly !== false);

  return (
    <article className="rounded-2xl border border-border/60 bg-surface-elevated bg-card p-5 sm:p-6 shadow-sm transition-all hover:border-brand-glow/30 hover:shadow-md flex flex-col h-full">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {track.board?.code ?? "Board"} • {track.classLevel ?? "Class"}
          </span>
        </div>
        <h3 className="text-xl font-bold font-heading text-foreground mb-1">
          {displayName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {track.subject?.name ?? "Mathematics"} — {displayName} Curriculum
        </p>
      </div>

      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <svg
                className="size-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 10v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6" />
                <polyline points="22 6 12 12 2 6" />
              </svg>
              <span className="text-xs font-medium">Curriculum</span>
            </div>
            <p className="text-sm font-medium text-foreground">{displayName}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <svg
                className="size-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 1-4-4V5" />
                <polyline points="17 11 12 6 7 11" />
              </svg>
              <span className="text-xs font-medium">Batches</span>
            </div>
            <p className="text-sm font-medium text-foreground">{activeBatches.length}</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
              <svg
                className="size-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-xs font-medium">Schedule</span>
            </div>
            <p className="text-sm font-medium text-foreground">See Timetable</p>
          </div>
        </div>

        {showFees && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Fee (Public)
              </span>
              <span className="text-sm font-semibold text-foreground">
                {activeBatches[0]?.feePlan?.assignedTotalAmount
                  ? `₹${activeBatches[0].feePlan.assignedTotalAmount?.toLocaleString()}`
                  : "Contact for details"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per term • Contact for exact amount
            </p>
          </div>
        )}

        <Link
          href={`/courses/${track.id}`}
          className="inline-flex items-center gap-2 w-full justify-center rounded-lg border border-border/60 bg-muted/50 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-brand-glow/30 hover:bg-muted hover:text-foreground"
        >
          View Details
          <svg
            className="size-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
