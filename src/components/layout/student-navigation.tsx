"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Home,
  Megaphone,
  WalletCards,
} from "lucide-react";

const studentLinks = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/course", label: "Course", icon: BookOpen },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
  { href: "/student/homework", label: "Work", icon: ClipboardCheck },
  { href: "/student/tests", label: "Tests", icon: FileText },
  { href: "/student/announcements", label: "Notices", icon: Megaphone },
  { href: "/student/fees", label: "Fees", icon: WalletCards },
];

export function StudentNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    if (pathname === href) {
      return;
    }
    e.preventDefault();
    setPendingPath(href);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/90 backdrop-blur-xl pb-safe sm:static sm:border-t-0 sm:bg-transparent sm:pb-0"
    >
      <div className="mx-auto flex max-w-5xl justify-around sm:justify-start sm:gap-4 sm:px-6 lg:px-8 sm:py-4">
        {studentLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const isItemPending = isPending && pendingPath === href;

          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => handleNavigate(e, href)}
              aria-current={isActive ? "page" : undefined}
              className={`relative flex min-h-[4.5rem] sm:min-h-12 flex-1 sm:flex-none flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 sm:rounded-full sm:px-4 text-xs sm:text-sm font-medium outline-none transition-all ${
                isItemPending
                  ? "opacity-60 scale-[0.98] sm:scale-95 bg-surface-interactive/50"
                  : "hover:bg-surface-interactive/30"
              }`}
            >
              {isActive && !isItemPending && (
                <motion.div
                  layoutId="student-active-tab"
                  className="absolute inset-x-2 top-1 bottom-1 sm:inset-0 rounded-xl sm:rounded-full bg-surface-elevated shadow-sm border border-border/50"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.3, duration: 0.7 }}
                />
              )}
              <span
                className={`relative z-10 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon
                  className={`size-5 sm:size-4 ${isItemPending ? "animate-pulse" : ""}`}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
