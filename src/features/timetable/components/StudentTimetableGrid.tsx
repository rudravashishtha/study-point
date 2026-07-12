"use client";

import { ExternalLink, MapPin } from "lucide-react";

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

export function StudentTimetableGrid({
  groups,
}: {
  groups: {
    dayOfWeek: number;
    dayLabel: string;
    schedules: {
      id: string;
      startTime: string;
      endTime: string;
      roomOrLocation?: string | null;
      liveClassUrl?: string | null;
      batch?: {
        name: string;
        curriculumTrack?: {
          subject?: { name: string };
        };
      };
    }[];
  }[];
}) {
  if (groups.length === 0) return null;

  const today = new Date().getDay();

  return (
    <div className="divide-y">
      {groups.map((group) => {
        const isToday = group.dayOfWeek === today;
        return (
          <div key={group.dayOfWeek} className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {group.dayLabel}
              </h3>
              {isToday && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Today
                </span>
              )}
            </div>

            <div className="space-y-2">
              {group.schedules.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="min-w-[80px] text-xs font-semibold text-muted-foreground">
                      {formatTime(s.startTime)} – {formatTime(s.endTime)}
                    </div>
                    <div>
                      <p className="font-medium leading-tight">
                        {s.batch?.curriculumTrack?.subject?.name || "Class"}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.batch?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-[92px] sm:pl-0">
                    {s.roomOrLocation && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {s.roomOrLocation}
                      </span>
                    )}
                    {s.liveClassUrl && (
                      <a
                        href={s.liveClassUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
                      >
                        <ExternalLink className="size-3" />
                        Join
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
