import Link from "next/link";
import {
  BookMarked,
  CalendarDays,
  ClipboardList,
  FileSpreadsheet,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/curriculum", label: "Curriculum", icon: BookMarked },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/batches", label: "Batches", icon: CalendarDays },
  { href: "/admin/questions", label: "Questions", icon: ClipboardList },
  { href: "/admin/fees", label: "Fees", icon: WalletCards },
  { href: "/admin/imports", label: "Imports", icon: FileSpreadsheet },
  { href: "/admin/announcements", label: "Notices", icon: Megaphone },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-muted/30 text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Admin dashboard
            </p>
            <h1 className="text-xl font-semibold">Institute operations</h1>
          </div>
          <nav aria-label="Admin navigation" className="flex gap-2 overflow-x-auto pb-1">
            {adminLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
