import { Activity, CalendarDays, Users, WalletCards } from "lucide-react";

const widgets = [
  { label: "Active students", icon: Users },
  { label: "Current batches", icon: CalendarDays },
  { label: "Pending dues", icon: WalletCards },
  { label: "Recent activity", icon: Activity },
];

export default function AdminOverviewPage() {
  return (
    <section>
      <h2 className="text-2xl font-semibold">Overview</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        Operational widgets will appear here after data and permissions are implemented.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {widgets.map(({ label, icon: Icon }) => (
          <div
            key={label}
            className="min-h-32 rounded-lg border border-border bg-card p-4"
          >
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
