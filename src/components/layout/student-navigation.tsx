"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { BookOpen, CalendarClock, ClipboardCheck, Home, WalletCards } from "lucide-react";

const studentLinks = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/course", label: "Course", icon: BookOpen },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
  { href: "/student/homework", label: "Work", icon: ClipboardCheck },
  { href: "/student/fees", label: "Fees", icon: WalletCards },
];

export function StudentNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/90 backdrop-blur-xl pb-safe sm:static sm:border-t-0 sm:bg-transparent sm:pb-0"
    >
      <div className="mx-auto flex max-w-5xl justify-around sm:justify-start sm:gap-4 sm:px-6 lg:px-8 sm:py-4">
        {studentLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex min-h-[4.5rem] sm:min-h-12 flex-1 sm:flex-none flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 sm:rounded-full sm:px-4 text-xs sm:text-sm font-medium outline-none transition-colors"
            >
              {isActive && (
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
                <Icon className="size-5 sm:size-4" aria-hidden="true" />
                <span>{label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
