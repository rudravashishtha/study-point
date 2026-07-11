"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CourseCard } from "./CourseCard";
import { cn } from "@/lib/utils";

interface CourseGroupProps {
  board: {
    id: string;
    code: string;
    name: string;
  };
  programmes: Array<{
    programme: {
      id: string;
      code: string;
      name: string;
    } | null;
    tracks: Array<{
      id: string;
      displayName: string;
      classLevel: string;
      board: { id: string; code: string; name: string };
      programme: { id: string; code: string; name: string } | null;
      subject: { id: string; name: string };
      batches: Array<{
        id: string;
        name: string;
        isActive: boolean;
        feePlan: {
          id: string;
          name: string;
          showPublicly: boolean;
          assignedTotalAmount: number | null;
        } | null;
      }>;
    }>;
  }>;
}

export function CourseGroup({ board, programmes }: CourseGroupProps) {
  const totalTracks = programmes.reduce((sum, p) => sum + p.tracks.length, 0);

  return (
    <section className="py-12 md:py-16" aria-labelledby={`board-${board.code}-heading`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-glow mb-1">
                {board.code} Board
              </p>
              <h2
                id={`board-${board.code}-heading`}
                className="text-2xl md:text-3xl font-bold font-heading text-foreground"
              >
                {board.name}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {totalTracks} {totalTracks === 1 ? "course track" : "course tracks"}
            </p>
          </div>
        </header>

        {programmes.map(({ programme, tracks }, index) => (
          <div key={programme?.id ?? "general"} className="space-y-8">
            {programme && (
              <div className="mb-4">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {programme.code}: {programme.name}
                </p>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((track) => (
                <CourseCard
                  key={track.id}
                  track={track}
                  batches={track.batches}
                  showFees={true}
                />
              ))}
            </div>

            {index !== programmes.length - 1 && (
              <div className="border-t border-border/50 my-8" />
            )}
          </div>
        ))}

        {programmes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No courses currently available for this board.</p>
          </div>
        )}
      </div>
    </section>
  );
}
