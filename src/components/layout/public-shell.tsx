import { MapPin, Megaphone } from "lucide-react";
import { PublicHeader } from "./public-header";
import { siteConfig } from "@/config/site";
import Link from "next/link";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased flex flex-col relative overflow-hidden">
      <PublicHeader />

      {/* Spacer for fixed header */}
      <div className="h-20 sm:h-24" />

      <main className="flex-1 w-full">{children}</main>

      <footer className="border-t border-border/10 bg-[#060A14] text-white mt-24 relative overflow-hidden">
        {/* Footer mathematical subtle background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 0%, var(--brand-glow) 0%, transparent 70%)",
          }}
        />

        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="inline-block">
              <p className="font-heading text-3xl font-bold tracking-tight">
                {siteConfig.name}
              </p>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-glow mt-1">
                Mathematics Institute
              </p>
            </Link>
            <p className="max-w-md text-base leading-relaxed text-slate-400">
              {siteConfig.description} We build profound mathematical intuition through
              structured foundations, not rote memorization.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-lg">Academics</h4>
            <ul className="space-y-3 text-slate-400">
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Class IX & X Foundations
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  Class XI & XII Boards
                </Link>
              </li>
              <li>
                <Link href="/courses" className="hover:text-white transition-colors">
                  CBSE & CISCE Tracks
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-white transition-colors">
                  Study Material
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-lg">Institute</h4>
            <ul className="space-y-3 text-slate-400">
              <li className="flex items-start gap-3">
                <MapPin className="size-5 shrink-0 text-brand-glow mt-0.5" />
                <span>{siteConfig.contact.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Megaphone className="size-5 shrink-0 text-brand-glow" />
                <Link
                  href="/announcements"
                  className="hover:text-white transition-colors"
                >
                  Public Notices
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500">
            <p>
              © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 sm:mt-0">
              <Link href="#" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
