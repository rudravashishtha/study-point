import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import {
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  Plus,
  Upload,
  Search,
  CheckCircle2,
} from "lucide-react";

async function getDashboardMetrics() {
  const [
    activeStudents,
    pendingEnrolments,
    todayBatches,
    pendingFees,
    requiresAction,
  ] = await Promise.all([
    db.enrolment.count({ where: { status: "ACTIVE" } }),
    db.enrolment.count({ where: { status: "PENDING" } }),
    db.batch.count({
      where: {
        archivedAt: null,
        isActive: true,
        schedules: {
          some: {
            dayOfWeek: new Date().getDay(),
          },
        },
      },
    }),
    db.studentFeeAssignment.count({
      where: {
        status: "ACTIVE",
      },
    }),
    db.enrolment.count({
      where: { status: "PENDING" },
    }),
  ]);

  return { activeStudents, pendingEnrolments, todayBatches, pendingFees, requiresAction };
}

export default async function AdminDashboard() {
  await requireAdmin();
  const metrics = await getDashboardMetrics();

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. & 2. Search and Primary Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-2 order-1 lg:order-none">
        <form
          action="/admin/students"
          method="GET"
          className="relative w-full sm:w-96"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            name="search"
            placeholder="Search student, batch, or phone..."
            className="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-elevated border border-border/60 text-sm focus:outline-none focus:ring-1 focus:ring-brand-glow focus:border-brand-glow transition-all"
          />
        </form>
        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
          <Link
            href="/admin/imports"
            className="flex-1 sm:flex-none h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-surface-elevated border border-border/60 hover:bg-surface-interactive transition-colors text-sm font-semibold"
          >
            <Upload className="size-4 opacity-70" /> Import
          </Link>
          <Link
            href="/admin/students"
            className="flex-1 sm:flex-none h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-md text-sm font-semibold"
          >
            <Plus className="size-4" /> Add Student
          </Link>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 order-2 lg:order-none">
        {/* Main Column */}
        <div className="contents lg:flex lg:flex-col lg:col-span-2 lg:gap-6">
          {/* 3. Metrics / Student Overview */}
          <section className="order-3 lg:order-none grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Active Students", value: metrics.activeStudents, icon: Users },
              { label: "Pending Enrolments", value: metrics.pendingEnrolments, icon: AlertCircle },
              { label: "Today's Batches", value: metrics.todayBatches, icon: Calendar },
              { label: "Pending Fees", value: metrics.pendingFees, icon: CreditCard },
            ].map((metric, i) => (
              <div
                key={i}
                className="bg-surface-elevated border border-border/40 rounded-xl p-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-4">
                  <metric.icon className="size-4 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading">{metric.value}</p>
                  <p className="text-xs font-medium text-muted-foreground mt-1">
                    {metric.label}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* 5. Today's Batches */}
          <section className="order-5 lg:order-none bg-surface-elevated border border-border/40 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/40 flex justify-between items-center bg-surface/50">
              <h3 className="font-bold text-sm">Today&apos;s Schedule</h3>
              <Link
                href="/admin/batches"
                className="text-xs font-semibold text-brand-glow hover:underline"
              >
                Manage Timetable
              </Link>
            </div>

            <div className="p-8 flex flex-col items-center justify-center text-center bg-surface/20 min-h-[250px]">
              <div className="size-12 rounded-full border border-dashed border-border flex items-center justify-center mb-3 bg-surface/50">
                <Calendar className="size-5 text-muted-foreground opacity-50" />
              </div>
              <h4 className="text-sm font-bold mb-1">No batches scheduled today</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                When academic batches are created and assigned to today&apos;s schedule,
                they will appear here for quick access.
              </p>
            </div>
          </section>

          {/* 6. Recent Operational Activity */}
          <section className="order-6 lg:order-none bg-surface-elevated border border-border/40 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/40 flex justify-between items-center bg-surface/50">
              <h3 className="font-bold text-sm">Recent Activity</h3>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center bg-surface/20 opacity-60">
              <p className="text-sm font-bold mb-1">No recent activity</p>
              <p className="text-xs text-muted-foreground">
                Recent administrative actions will be logged here
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {/* 4. Action Required */}
          <section className="order-4 lg:order-none bg-surface-elevated border border-border/40 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/40 bg-surface/50 flex items-center gap-2">
              <div className={`size-2 rounded-full ${metrics.requiresAction > 0 ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
              <h3 className="font-bold text-sm">Action Required</h3>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {metrics.requiresAction > 0 ? (
                <Link
                  href="/admin/students?status=PENDING"
                  className="p-4 rounded-lg border border-border/60 bg-surface flex items-center gap-3 hover:bg-surface-interactive transition-colors"
                >
                  <AlertCircle className="size-6 text-amber-500/80 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">
                      {metrics.requiresAction} pending enrolment{metrics.requiresAction > 1 ? "s" : ""}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Review and process pending student enrolments.
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="p-6 rounded-lg border border-border/60 bg-surface flex flex-col items-center justify-center text-center gap-3">
                  <CheckCircle2 className="size-8 text-emerald-500/80 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">All caught up</h4>
                    <p className="text-xs text-muted-foreground">
                      Items requiring attention will appear here when necessary.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 7. Quick Links */}
          <section className="order-7 lg:order-none bg-surface-elevated border border-border/40 rounded-xl overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b border-border/40 bg-surface/50">
              <h3 className="font-bold text-sm">Quick Links</h3>
            </div>
            <div className="p-2 flex flex-col">
              {[
                { href: "/admin/batches", label: "Create new batch" },
                { href: "/admin/materials", label: "Upload study material" },
                { href: "/admin/tests", label: "Publish new test" },
                { href: "/admin/announcements", label: "Send public announcement" },
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-surface-interactive transition-colors text-left group"
                >
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    {link.label}
                  </span>
                  <Plus className="size-4 opacity-0 group-hover:opacity-50 text-foreground" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
