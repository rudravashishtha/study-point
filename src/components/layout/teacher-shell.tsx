"use client";

import { TeacherNavigation } from "./teacher-navigation";
import { Menu, X, LogOut } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";

interface BatchLink {
  id: string;
  name: string;
  subjectName: string;
  classLevel: string;
}

export function TeacherShell({
  children,
  batches,
  instituteName = "Study Point",
}: {
  children: React.ReactNode;
  batches: BatchLink[];
  instituteName?: string;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const drawerRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeDrawer = useCallback(() => {
    setMobileMenuOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }
      if (e.key === "Tab") {
        const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const closeBtn = drawerRef.current?.querySelector<HTMLButtonElement>(
      'button[aria-label="Close menu"]',
    );
    const timer = requestAnimationFrame(() => closeBtn?.focus());
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen, closeDrawer]);

  const segments = pathname.split("/").filter(Boolean);
  const currentPage =
    segments.length > 1
      ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
      : "Dashboard";

  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased flex flex-col md:flex-row overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-surface-elevated shrink-0 h-dvh sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-border/40 shrink-0">
          <Link href="/teacher" className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {instituteName}
            </span>
            <span className="text-sm font-bold font-heading">Teacher Workspace</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <TeacherNavigation batches={batches} />
        </div>

        <div className="p-4 border-t border-border/40 shrink-0">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full px-2 py-1.5 rounded-lg hover:bg-surface"
            >
              <LogOut className="size-4 opacity-70" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Top App Bar */}
      <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-border/40 bg-surface-elevated sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          <button
            ref={menuButtonRef}
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md hover:bg-surface-interactive transition-colors"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-bold font-heading">{currentPage}</span>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 md:hidden"
              onClick={closeDrawer}
              aria-hidden="true"
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-surface-elevated border-r border-border/40 z-50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
                    {instituteName}
                  </span>
                  <span className="text-sm font-bold font-heading">Teacher Workspace</span>
                </div>
                <button
                  onClick={closeDrawer}
                  className="p-1.5 rounded-md hover:bg-surface-interactive transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <TeacherNavigation
                  batches={batches}
                  isMobile
                  closeMobileNav={() => setMobileMenuOpen(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Desktop Contextual Top Bar */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 border-b border-border/40 bg-surface/50 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <h1 className="text-lg font-bold font-heading">{currentPage}</h1>
        </header>

        {/* Workspace Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface"
        >
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
