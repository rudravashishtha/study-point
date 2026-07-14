"use client";

import { useState } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { EnrolmentCourseInfo } from "@/server/services/student-course";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function ScheduleTable({ schedules }: { schedules: EnrolmentCourseInfo["schedules"] }) {
  const sorted = [...schedules].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek),
  );

  return (
    <div className="space-y-1.5">
      {sorted.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-sm"
        >
          <span className="min-w-[3rem] text-xs font-semibold text-primary">
            {DAY_LABELS[s.dayOfWeek]}
          </span>
          <Clock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="text-foreground">
            {s.startTime} – {s.endTime}
          </span>
          {s.roomOrLocation && (
            <>
              <MapPin
                className="size-3.5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{s.roomOrLocation}</span>
            </>
          )}
          {s.liveClassUrl && (
            <a
              href={s.liveClassUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              <Video className="size-3.5" aria-hidden="true" />
              Join
            </a>
          )}
        </div>
      ))}
      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No schedule set.</p>
      )}
    </div>
  );
}

function EnrolmentCard({
  enrolment,
  isExpanded,
  onToggle,
}: {
  enrolment: EnrolmentCourseInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/20"
        aria-expanded={isExpanded}
      >
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold text-foreground">
              Class {enrolment.classLevel} — {enrolment.subjectName}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
            {enrolment.batchName && (
              <span className="inline-flex items-center gap-1">
                <User className="size-3" aria-hidden="true" />
                {enrolment.batchName}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" aria-hidden="true" />
              {enrolment.academicSession}
            </span>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        ) : (
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border/40 px-5 py-4 space-y-4">
          {enrolment.teachers.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Teachers
              </p>
              <div className="flex flex-wrap gap-2">
                {enrolment.teachers.map((t, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    <User className="size-3" aria-hidden="true" />
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Schedule
            </p>
            <ScheduleTable schedules={enrolment.schedules} />
          </div>
        </div>
      )}
    </div>
  );
}

export function StudentCourseView({ enrolments }: { enrolments: EnrolmentCourseInfo[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    enrolments.length === 1 ? enrolments[0].enrolmentId : null,
  );

  if (enrolments.length === 0) return null;

  return (
    <div className="space-y-4">
      {enrolments.length > 1 && (
        <p className="text-sm text-muted-foreground">
          You are enrolled in {enrolments.length} courses. Select each to view details.
        </p>
      )}
      <div className="space-y-3">
        {enrolments.map((e) => (
          <EnrolmentCard
            key={e.enrolmentId}
            enrolment={e}
            isExpanded={expandedId === e.enrolmentId}
            onToggle={() =>
              setExpandedId(expandedId === e.enrolmentId ? null : e.enrolmentId)
            }
          />
        ))}
      </div>
    </div>
  );
}
