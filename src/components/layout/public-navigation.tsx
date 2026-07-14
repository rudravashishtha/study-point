"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/announcements", label: "Announcements" },
  { href: "/login", label: "Login" },
];

export function PublicNavigation() {
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
      aria-label="Public navigation"
      className="flex gap-4 overflow-x-auto items-center"
    >
      {publicLinks.map((link) => {
        const isActive = pathname === link.href;
        const isItemPending = isPending && pendingPath === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={(e) => handleNavigate(e, link.href)}
            aria-current={isActive ? "page" : undefined}
            className={`relative rounded-full px-5 py-2.5 text-base font-semibold outline-none transition-all focus-visible:ring-2 focus-visible:ring-brand-glow ${
              isItemPending
                ? "opacity-60 scale-[0.98] bg-surface-interactive/50"
                : isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/30"
            }`}
          >
            {isActive && !isItemPending && (
              <motion.div
                layoutId="public-active-tab"
                className="absolute inset-0 rounded-full bg-surface-elevated shadow-sm border border-border/60"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className={`relative z-10 ${isItemPending ? "animate-pulse" : ""}`}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
