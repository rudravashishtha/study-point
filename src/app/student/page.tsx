import { BookOpen, CalendarClock, ClipboardCheck } from "lucide-react";

const cards = [
  { label: "Next class", icon: CalendarClock },
  { label: "Current homework", icon: ClipboardCheck },
  { label: "Recent materials", icon: BookOpen },
];

export default function StudentDashboardPage() {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Dashboard</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Student data will be scoped to the active enrolment after authentication and
        permissions are implemented.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-border bg-card p-4">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
