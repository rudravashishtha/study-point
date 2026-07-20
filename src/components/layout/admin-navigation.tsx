"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Calendar,
  CalendarRange,
  CreditCard,
  Database,
  FileText,
  Globe,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Settings,
  ClipboardList,
  Users,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

type NavLink = {
  href?: string;
  label: string;
  icon: LucideIcon;
  subItems?: { href: string; label: string }[];
};

type NavGroup = {
  name: string;
  links: NavLink[];
};

export const adminNavigationGroups: NavGroup[] = [
  {
    name: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    name: "Academics",
    links: [
      {
        label: "Curriculum",
        icon: BookOpen,
        subItems: [
          { href: "/admin/curriculum/curriculum-tracks", label: "Tracks" },
          { href: "/admin/curriculum/subjects", label: "Subjects" },
          { href: "/admin/curriculum/boards", label: "Boards" },
          { href: "/admin/batches", label: "Batches" },
        ],
      },
      {
        href: "/admin/academic-sessions",
        label: "Academic Sessions",
        icon: CalendarRange,
      },
      { href: "/admin/live-classes", label: "Live Classes", icon: Calendar },
      { href: "/admin/materials", label: "Study Materials", icon: FileText },
      { href: "/admin/homework", label: "Homework", icon: FileText },
      { href: "/admin/tests", label: "Tests", icon: FileText },
    ],
  },
  {
    name: "People",
    links: [
      { href: "/admin/students", label: "Students", icon: Users },
      { href: "/admin/students/activate", label: "Activate Accounts", icon: Users },
      {
        label: "Student Intake",
        icon: ClipboardList,
        subItems: [
          { href: "/admin/intake-links", label: "Private Links" },
          { href: "/admin/intake-submissions", label: "Submissions" },
        ],
      },
      { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
      {
        href: "/admin/teachers/activate",
        label: "Teacher Invitations",
        icon: GraduationCap,
      },
    ],
  },
  {
    name: "Assessment",
    links: [{ href: "/admin/questions", label: "Question Bank", icon: FileText }],
  },
  {
    name: "Finance",
    links: [
      { href: "/admin/fees", label: "Fee Plans", icon: CreditCard },
      { href: "/admin/fee-assignments", label: "Assignments", icon: CreditCard },
    ],
  },
  {
    name: "Operations",
    links: [
      { href: "/admin/imports", label: "Data Imports", icon: Database },
      { href: "/admin/announcements", label: "Notices", icon: Megaphone },
    ],
  },
  {
    name: "Content",
    links: [{ href: "/admin/website", label: "Website", icon: Globe }],
  },
  {
    name: "System",
    links: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminNavigation({
  isMobile = false,
  closeMobileNav,
}: {
  isMobile?: boolean;
  closeMobileNav?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Pre-open groups if a subitem is active
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    adminNavigationGroups.forEach((group) => {
      group.links.forEach((link) => {
        if (link.subItems?.some((sub) => pathname.startsWith(sub.href))) {
          initialState[link.label] = true;
        }
      });
    });
    return initialState;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }
    if (pathname === href) {
      closeMobileNav?.();
      return;
    }
    e.preventDefault();
    setPendingPath(href);
    if (isMobile && closeMobileNav) {
      closeMobileNav();
    }
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-6 py-2">
      {adminNavigationGroups.map((group) => (
        <div key={group.name} className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {group.name}
          </p>
          {group.links.map((link) => {
            if (link.subItems) {
              const isOpen = openGroups[link.label];
              const isAnyChildActive = link.subItems.some((sub) => pathname === sub.href);

              return (
                <div key={link.label} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => toggleGroup(link.label)}
                    className={`group relative flex h-9 items-center justify-between gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all hover:bg-surface-interactive/30 ${
                      isAnyChildActive ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <link.icon
                        className={`size-4 ${isAnyChildActive ? "text-brand-glow" : "text-muted-foreground opacity-70 group-hover:opacity-100"}`}
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </span>
                    <ChevronDown
                      className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-1 flex flex-col gap-1 pl-9 pr-2">
                          {link.subItems.map((sub) => {
                            const isSubActive = pathname === sub.href;
                            const isSubPendingState = isPending && pendingPath === sub.href;

                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={(e) => handleNavigate(e, sub.href)}
                                aria-current={isSubActive ? "page" : undefined}
                                className={`relative flex h-8 items-center rounded-md px-3 text-sm transition-colors ${
                                  isSubPendingState
                                    ? "opacity-60 bg-surface-interactive/50"
                                    : isSubActive
                                      ? "bg-surface-interactive text-foreground font-medium"
                                      : "text-muted-foreground hover:bg-surface-interactive/30 hover:text-foreground"
                                }`}
                              >
                                {isSubActive && !isSubPendingState && (
                                  <motion.div
                                    layoutId={
                                      isMobile
                                        ? "admin-mobile-active-sub"
                                        : "admin-desktop-active-sub"
                                    }
                                    className="absolute inset-0 rounded-md bg-surface-interactive shadow-sm border border-border/50"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                                  />
                                )}
                                <span className="relative z-10">{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Normal link
            const href = link.href!;
            const isActive = pathname === href;
            const isPendingState = isPending && pendingPath === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavigate(e, href)}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all ${
                  isPendingState
                    ? "opacity-60 scale-[0.98] bg-surface-interactive/50"
                    : "hover:bg-surface-interactive/30"
                }`}
              >
                {isActive && !isPendingState && (
                  <motion.div
                    layoutId={
                      isMobile ? "admin-mobile-active-tab" : "admin-desktop-active-tab"
                    }
                    className="absolute inset-0 rounded-lg bg-surface-interactive shadow-sm border border-border/50"
                    initial={false}
                    transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                  />
                )}

                {/* Active left bar indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-glow z-20" />
                )}

                <span
                  className={`relative z-10 flex items-center gap-3 ${isActive ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  <link.icon
                    className={`size-4 ${isActive ? "text-brand-glow" : "text-muted-foreground opacity-70 group-hover:opacity-100"} ${
                      isPendingState ? "animate-pulse" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <span>{link.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
