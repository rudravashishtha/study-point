import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Library,
  Megaphone,
  Video,
  WalletCards,
} from "lucide-react";
import {
  type DashboardAnnouncementItem,
  type DashboardHomeworkItem,
  type DashboardTestItem,
  type DashboardFeeAssignment,
  type DashboardFeeDue,
  type DashboardCourseInfo,
  type DashboardMaterialItem,
} from "@/server/services/student-dashboard";

interface DashboardTimetableGroup {
  dayOfWeek: number;
  dayLabel: string;
  schedules: {
    startTime: string;
    endTime: string;
    liveClassUrl: string | null;
    batch?: {
      name: string;
      curriculumTrack?: { subject?: { name: string } | null } | null;
    } | null;
  }[];
}

function WidgetCard({
  title,
  href,
  icon: Icon,
  children,
  isEmpty,
  emptyText,
}: {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isEmpty: boolean;
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl bg-surface-elevated border border-border/40 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-bold font-heading text-lg">
          <Icon className="size-5 text-brand-glow" />
          {title}
        </h2>
        <Link
          href={href}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center"
        >
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {isEmpty ? (
        <p className="text-sm text-muted-foreground py-4">{emptyText}</p>
      ) : (
        children
      )}
    </section>
  );
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isLiveClassActive(
  startTime: string,
  endTime: string,
): { status: "live" | "upcoming" | "none"; startsInMinutes?: number } {
  const now = new Date();
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    startH,
    startM,
  );
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM);
  if (now >= start && now <= end) return { status: "live" };
  const diff = (start.getTime() - now.getTime()) / 60000;
  if (diff >= 0 && diff <= 15)
    return { status: "upcoming", startsInMinutes: Math.round(diff) };
  return { status: "none" };
}

export function StudentDashboard({
  data,
}: {
  data: {
    timetable: { groups: DashboardTimetableGroup[] };
    announcements: { items: DashboardAnnouncementItem[] };
    homework: { items: DashboardHomeworkItem[] };
    tests: { items: DashboardTestItem[] };
    fees: { assignments: DashboardFeeAssignment[] };
    courses: DashboardCourseInfo[];
    recentMaterials: DashboardMaterialItem[];
  };
}) {
  const today = new Date().getDay();
  const todayGroup = data.timetable.groups.find((g) => g.dayOfWeek === today);
  const todayClassCount = todayGroup?.schedules.length ?? 0;

  const todayFirstClass = todayGroup?.schedules[0];
  const futureGroup = data.timetable.groups
    .filter((g) => g.dayOfWeek > today)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0];
  const futureFirstClass = futureGroup?.schedules[0] ?? null;

  const nextClass = todayFirstClass ?? futureFirstClass;
  const nextClassIsToday = Boolean(todayFirstClass);

  const activeLiveClass =
    todayGroup?.schedules.find((s) => {
      if (!s.liveClassUrl) return false;
      const { status } = isLiveClassActive(s.startTime, s.endTime);
      return status === "live" || status === "upcoming";
    }) ?? null;

  const activeLiveStatus = activeLiveClass
    ? isLiveClassActive(activeLiveClass.startTime, activeLiveClass.endTime)
    : null;

  const pendingTotal = data.fees.assignments
    .flatMap((a: DashboardFeeAssignment) => a.dues || [])
    .filter(
      (d: DashboardFeeDue) =>
        d.status === "PENDING" || d.status === "OVERDUE" || d.status === "PARTIALLY_PAID",
    )
    .reduce(
      (sum: number, d: DashboardFeeDue) =>
        sum + (parseFloat(d.amountDue) - parseFloat(d.amountWaived)),
      0,
    );

  return (
    <div className="space-y-5">
      {/* Live class banner */}
      {activeLiveClass && activeLiveStatus && (
        <a
          href={activeLiveClass.liveClassUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-xl border px-5 py-4 transition-colors ${
            activeLiveStatus.status === "live"
              ? "border-green-500/30 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200"
              : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-200"
          } hover:opacity-90`}
        >
          <Video className="size-6 shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">
              {activeLiveStatus.status === "live" ? "Live Now" : "Starting Soon"}
            </p>
            <p className="text-sm opacity-80 truncate">
              {activeLiveClass.batch?.curriculumTrack?.subject?.name ?? "Class"}
              {activeLiveClass.batch?.name ? ` · ${activeLiveClass.batch.name}` : ""}
              {activeLiveStatus.status === "upcoming" && activeLiveStatus.startsInMinutes
                ? ` · in ${activeLiveStatus.startsInMinutes} min`
                : ""}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold underline underline-offset-2">
            Join Now
          </span>
        </a>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        {/* My Course */}
        <WidgetCard
          title="My Course"
          href="/student/course"
          icon={BookOpen}
          isEmpty={data.courses.length === 0}
          emptyText="No active courses."
        >
          <div className="space-y-2">
            {data.courses.slice(0, 2).map((c: DashboardCourseInfo, i: number) => (
              <div key={i} className="rounded-lg border bg-card p-3 text-sm">
                <p className="font-medium">
                  Class {c.classLevel} — {c.subjectName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.batchName ? `${c.batchName} · ` : ""}
                  {c.academicSession}
                </p>
              </div>
            ))}
            {data.courses.length > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                +{data.courses.length - 2} more courses
              </p>
            )}
          </div>
        </WidgetCard>

        {/* Next Class */}
        <WidgetCard
          title={
            todayClassCount > 0 ? `Next Class (${todayClassCount} today)` : "Next Class"
          }
          href="/student/timetable"
          icon={CalendarClock}
          isEmpty={!nextClass}
          emptyText="No upcoming classes scheduled."
        >
          {nextClass && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
              <div>
                <p className="font-medium leading-tight">
                  {nextClass.batch?.curriculumTrack?.subject?.name || "Class"}
                </p>
                <p className="text-xs text-muted-foreground">{nextClass.batch?.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatTime(nextClass.startTime)}</p>
                <p className="text-xs text-muted-foreground">
                  {nextClassIsToday ? "Today" : "Upcoming"}
                </p>
              </div>
            </div>
          )}
        </WidgetCard>

        {/* Pending Fees */}
        <WidgetCard
          title="Fee Status"
          href="/student/fees"
          icon={WalletCards}
          isEmpty={data.fees.assignments.length === 0}
          emptyText="No fee records yet."
        >
          <div className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">Pending Amount</p>
            <p className="text-2xl font-bold font-heading">₹{pendingTotal.toFixed(2)}</p>
          </div>
        </WidgetCard>

        {/* Recent Study Materials */}
        <WidgetCard
          title="Recent Materials"
          href="/student/study-materials"
          icon={Library}
          isEmpty={data.recentMaterials.length === 0}
          emptyText="No materials yet."
        >
          <ul className="space-y-2">
            {data.recentMaterials.slice(0, 3).map((m: DashboardMaterialItem) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium truncate">{m.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {m.publishedAt ? formatDate(m.publishedAt) : ""}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>

        {/* Pending Homework */}
        <WidgetCard
          title="Homework"
          href="/student/homework"
          icon={ClipboardCheck}
          isEmpty={data.homework.items.length === 0}
          emptyText="No homework assigned."
        >
          <ul className="space-y-2">
            {data.homework.items.slice(0, 3).map((h: DashboardHomeworkItem) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium truncate">{h.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(h.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>

        {/* Upcoming Tests */}
        <WidgetCard
          title="Tests"
          href="/student/tests"
          icon={FileText}
          isEmpty={data.tests.items.length === 0}
          emptyText="No tests scheduled."
        >
          <ul className="space-y-2">
            {data.tests.items.slice(0, 3).map((t: DashboardTestItem) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium truncate">{t.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatDate(t.testDate)}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>

        {/* Recent Announcements */}
        <WidgetCard
          title="Notices"
          href="/student/announcements"
          icon={Megaphone}
          isEmpty={data.announcements.items.length === 0}
          emptyText="No notices yet."
        >
          <ul className="space-y-2">
            {data.announcements.items.slice(0, 3).map((a: DashboardAnnouncementItem) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 text-sm border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="font-medium truncate">{a.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.publishedAt
                    ? new Date(a.publishedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      </div>
    </div>
  );
}
