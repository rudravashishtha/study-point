"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  FileText,
  Home,
  Library,
  Megaphone,
  MoreHorizontal,
  WalletCards,
} from "lucide-react";

type LinkItem = {
  href: string;
  label: string;
  icon: typeof Home;
};

const allLinks: LinkItem[] = [
  { href: "/student", label: "Home", icon: Home },
  { href: "/student/course", label: "Course", icon: BookOpen },
  { href: "/student/study-materials", label: "Materials", icon: Library },
  { href: "/student/timetable", label: "Timetable", icon: CalendarClock },
  { href: "/student/homework", label: "Work", icon: ClipboardCheck },
  { href: "/student/tests", label: "Tests", icon: FileText },
  { href: "/student/fees", label: "Fees", icon: WalletCards },
  { href: "/student/announcements", label: "Notices", icon: Megaphone },
];

const mobilePrimary: LinkItem[] = allLinks.slice(0, 4);
const mobileOverflow: LinkItem[] = allLinks.slice(4);

export function StudentNavigation({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // The announcements page marks visible notices read on open (server-side),
  // but the layout computes `unreadCount` before that happens, so the value is
  // stale for the current request. While the student is on the Notices view we
  // treat the badge as cleared so it disappears on that view without a flash.
  // `usePathname` is available during SSR, so this is correct in the initial
  // server-rendered HTML, not just after hydration.
  const effectiveUnread = pathname === "/student/announcements" ? 0 : unreadCount;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function NavLink({ href, label, icon: Icon }: LinkItem) {
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        onClick={() => setOverflowOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex min-h-[4.5rem] sm:min-h-12 flex-1 sm:flex-none flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 sm:rounded-full sm:px-4 text-xs sm:text-sm font-medium outline-none transition-all hover:bg-surface-interactive/30`}
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
          {label === "Notices" && effectiveUnread > 0 && (
            <span className="absolute -right-1.5 -top-0.5 sm:static sm:ml-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {effectiveUnread > 9 ? "9+" : effectiveUnread}
            </span>
          )}
        </span>
      </Link>
    );
  }

  return (
    <nav
      aria-label="Student navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-surface/90 backdrop-blur-xl pb-safe sm:static sm:border-t-0 sm:bg-transparent sm:pb-0"
    >
      {/* Desktop: all links inline */}
      <div className="hidden sm:flex mx-auto max-w-5xl justify-start gap-4 px-6 lg:px-8 py-4">
        {allLinks.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </div>

      {/* Mobile: 4 primary + More overflow */}
      <div className="flex sm:hidden mx-auto max-w-5xl justify-around">
        {mobilePrimary.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}

        <div ref={overflowRef} className="relative flex-1">
          <button
            type="button"
            onClick={() => setOverflowOpen((o) => !o)}
            aria-expanded={overflowOpen}
            aria-label="More navigation items"
            className={`relative flex min-h-[4.5rem] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium outline-none transition-all w-full hover:bg-surface-interactive/30 ${
              overflowOpen ? "bg-surface-interactive/30" : ""
            }`}
          >
            <MoreHorizontal
              className={`size-5 ${overflowOpen ? "text-primary" : "text-muted-foreground"}`}
              aria-hidden="true"
            />
            <span className={overflowOpen ? "text-primary" : "text-muted-foreground"}>
              More
            </span>
          </button>

          <AnimatePresence>
            {overflowOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-border/50 bg-surface-elevated shadow-lg overflow-hidden"
              >
                {mobileOverflow.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOverflowOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-interactive/30 ${
                        isActive
                          ? "text-primary bg-surface-interactive/20"
                          : "text-foreground"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {label}
                      {label === "Notices" && effectiveUnread > 0 && (
                        <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                          {effectiveUnread > 9 ? "9+" : effectiveUnread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
