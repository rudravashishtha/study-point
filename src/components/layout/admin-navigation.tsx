"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Calendar,
  CalendarRange,
  CreditCard,
  Database,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";

export const adminNavigationGroups = [
  {
    name: "Overview",
    links: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    name: "Academics",
    links: [
      { href: "/admin/curriculum", label: "Curriculum", icon: BookOpen },
      { href: "/admin/academic-sessions", label: "Academic Sessions", icon: CalendarRange },
      { href: "/admin/batches", label: "Batches", icon: Calendar },
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
      { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
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

  // Clear pending state when pathname changes
  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Let browser handle modifier clicks (ctrl/cmd/shift open in new tab)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    if (pathname === href) {
      closeMobileNav?.();
      return;
    }

    e.preventDefault();
    setPendingPath(href);
    
    // Immediate feedback for mobile
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
          {group.links.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            const isItemPending = isPending && pendingPath === href;

            return (
              <Link
                key={href}
                href={href}
                onClick={(e) => handleNavigate(e, href)}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all ${
                  isItemPending
                    ? "opacity-60 scale-[0.98] bg-surface-interactive/50"
                    : "hover:bg-surface-interactive/30"
                }`}
              >
                {isActive && !isItemPending && (
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
                  <Icon
                    className={`size-4 ${isActive ? "text-brand-glow" : "text-muted-foreground opacity-70 group-hover:opacity-100"} ${
                      isItemPending ? "animate-pulse" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
