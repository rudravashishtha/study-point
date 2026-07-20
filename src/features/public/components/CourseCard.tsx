"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

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
  const subjectName = track.subject?.name ?? "Coaching";
  const classLevel = track.classLevel ?? "Class";
  const displayName = track.displayName ?? `${classLevel} ${subjectName}`;

  const activeBatches = batches.filter((b) => b.feePlan?.showPublicly !== false);
  const feeAmount = activeBatches[0]?.feePlan?.assignedTotalAmount;

  return (
    <article className="group rounded-2xl border border-border/60 bg-surface-elevated p-5 sm:p-6 shadow-sm transition-all hover:border-brand-glow/30 hover:shadow-md flex flex-col h-full">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mb-2">
            {track.board?.code ?? "Board"} • {classLevel}
          </span>
          <h3 className="text-xl font-bold font-heading text-foreground">
            {displayName}
          </h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {subjectName} — {activeBatches.length} batch{activeBatches.length !== 1 ? "es" : ""} available
      </p>

      <div className="flex-1" />

      <div className="flex items-center gap-4 pt-4 border-t border-border/50">
        {showFees && (
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Fee</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {feeAmount ? `₹${feeAmount.toLocaleString()}` : "Contact for details"}
            </p>
          </div>
        )}
        <div className="ml-auto">
          <Link
            href="/admissions"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Enquire
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
