import Link from "next/link";
import { BookOpen, CalendarClock, ClipboardCheck, Home, WalletCards } from "lucide-react";

const studentLinks = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/course", label: "Course", icon: BookOpen },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
  { href: "/student/homework", label: "Work", icon: ClipboardCheck },
  { href: "/student/fees", label: "Fees", icon: WalletCards },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background pb-20 text-foreground sm:pb-0">
      <header className="border-b border-border bg-background">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Student portal
          </p>
          <h1 className="text-xl font-semibold">My mathematics desk</h1>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <nav
        aria-label="Student navigation"
        className="fixed inset-x-0 bottom-0 border-t border-border bg-background sm:static sm:border-t"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {studentLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
