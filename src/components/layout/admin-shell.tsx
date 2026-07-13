"use client";

import { AdminNavigation } from "./admin-navigation";
import { siteConfig } from "@/config/site";
import { Menu, X, LogOut, Bell } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/features/auth/actions";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Very simple breadcrumb derivation for top bar
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
          <Link href="/admin" className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-glow/80 mb-0.5">
              {siteConfig.name}
            </span>
            <span className="text-sm font-bold font-heading">Workspace</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <AdminNavigation />
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
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md hover:bg-surface-interactive transition-colors"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-bold font-heading">{currentPage}</span>
        </div>
        <button className="p-1.5 -mr-1.5 rounded-full hover:bg-surface-interactive transition-colors text-muted-foreground">
          <Bell className="size-4" />
        </button>
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
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[80%] max-w-sm bg-surface-elevated border-r border-border/40 z-50 shadow-2xl flex flex-col md:hidden"
            >
              <div className="h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-glow/80 mb-0.5">
                    {siteConfig.name}
                  </span>
                  <span className="text-sm font-bold font-heading">Workspace</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md hover:bg-surface-interactive transition-colors"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <AdminNavigation
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
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-surface-interactive transition-colors text-muted-foreground relative">
              <Bell className="size-5" />
              <span className="absolute top-2 right-2.5 size-2 rounded-full bg-brand-glow shadow-[0_0_8px_rgba(var(--brand-glow),0.8)]" />
            </button>
            <div className="size-8 rounded-full bg-surface-interactive border border-border/60 flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface">
          <div className="max-w-6xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
