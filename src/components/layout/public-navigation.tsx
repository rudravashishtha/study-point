"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/announcements", label: "Announcements" },
];

export function PublicNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Public navigation"
      className="flex gap-4 overflow-x-auto items-center"
    >
      {publicLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative rounded-full px-5 py-2.5 text-base font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-glow ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated/30"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="public-active-tab"
                className="absolute inset-0 rounded-full bg-surface-elevated shadow-sm border border-border/60"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
