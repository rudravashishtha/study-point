"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, BookOpen } from "lucide-react";

interface BatchLink {
  id: string;
  name: string;
  subjectName: string;
  classLevel: string;
}

interface TeacherNavigationProps {
  batches: BatchLink[];
  isMobile?: boolean;
  closeMobileNav?: () => void;
}

export function TeacherNavigation({
  batches,
  isMobile = false,
  closeMobileNav,
}: TeacherNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

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
    <nav aria-label="Teacher navigation" className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Overview
        </p>
        <TeacherNavLink
          href="/teacher"
          label="Dashboard"
          icon={LayoutDashboard}
          isActive={pathname === "/teacher"}
          isPending={isPending && pendingPath === "/teacher"}
          isMobile={isMobile}
          onNavigate={(e) => handleNavigate(e, "/teacher")}
        />
        <TeacherNavLink
          href="/teacher/agenda"
          label="My Agenda"
          icon={BookOpen}
          isActive={pathname === "/teacher/agenda"}
          isPending={isPending && pendingPath === "/teacher/agenda"}
          isMobile={isMobile}
          onNavigate={(e) => handleNavigate(e, "/teacher/agenda")}
        />
      </div>

      {batches.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            My Batches
          </p>
          {batches.map((batch) => {
            const href = `/teacher/batches/${batch.id}`;
            const isActive = pathname.startsWith(href);
            return (
              <TeacherNavLink
                key={batch.id}
                href={href}
                label={batch.name}
                icon={BookOpen}
                isActive={isActive}
                isPending={isPending && pendingPath === href}
                isMobile={isMobile}
                onNavigate={(e) => handleNavigate(e, href)}
              />
            );
          })}
        </div>
      )}
    </nav>
  );
}

function TeacherNavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isPending,
  isMobile,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isPending: boolean;
  isMobile: boolean;
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={`group relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all ${
        isPending
          ? "opacity-60 scale-[0.98] bg-surface-interactive/50"
          : "hover:bg-surface-interactive/30"
      }`}
    >
      {isActive && !isPending && (
        <motion.div
          layoutId={isMobile ? "teacher-mobile-active-tab" : "teacher-desktop-active-tab"}
          className="absolute inset-0 rounded-lg bg-surface-interactive shadow-sm border border-border/50"
          initial={false}
          transition={{ type: "spring", bounce: 0, duration: 0.2 }}
        />
      )}
      {isActive && (
        <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-glow z-20" />
      )}
      <span
        className={`relative z-10 flex items-center gap-3 ${isActive ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"}`}
      >
        <Icon
          className={`size-4 ${isActive ? "text-brand-glow" : "text-muted-foreground opacity-70 group-hover:opacity-100"} ${
            isPending ? "animate-pulse" : ""
          }`}
          aria-hidden="true"
        />
        <span>{label}</span>
      </span>
    </Link>
  );
}
