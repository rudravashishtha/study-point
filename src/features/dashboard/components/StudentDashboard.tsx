import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Megaphone,
  WalletCards,
} from "lucide-react";
import {
  type DashboardAnnouncementItem,
  type DashboardHomeworkItem,
  type DashboardTestItem,
  type DashboardFeeAssignment,
  type DashboardFeeDue,
} from "@/server/services/student-dashboard";

interface DashboardTimetableGroup {
  dayOfWeek: number;
  dayLabel: string;
  schedules: {
    startTime: string;
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

export function StudentDashboard({
  data,
}: {
  data: {
    timetable: { groups: DashboardTimetableGroup[] };
    announcements: { items: DashboardAnnouncementItem[] };
    homework: { items: DashboardHomeworkItem[] };
    tests: { items: DashboardTestItem[] };
    fees: { assignments: DashboardFeeAssignment[] };
  };
}) {
  const today = new Date().getDay();
  const todayGroup = data.timetable.groups.find((g) => g.dayOfWeek === today);
  const nextClass =
    todayGroup?.schedules[0] ||
    data.timetable.groups
      .filter((g) => g.dayOfWeek > today)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)[0]?.schedules[0] ||
    null;

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
    <div className="grid gap-5 md:grid-cols-2">
      {/* Next Class */}
      <WidgetCard
        title="Next Class"
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
                {todayGroup ? "Today" : "Upcoming"}
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
  );
}
