"use client";

import Link from "next/link";
import { GraduationCap, MapPin } from "lucide-react";
import { PublicNavigation } from "./public-navigation";
import { siteConfig } from "@/config/site";
import { motion, useScroll, useTransform } from "motion/react";

export function PublicHeader() {
  const { scrollY } = useScroll();
  const paddingY = useTransform(scrollY, [0, 100], ["1.5rem", "0.75rem"]);
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const borderColor = useTransform(
    scrollY,
    [0, 100],
    ["rgba(255,255,255,0)", "var(--color-border)"],
  );

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50 flex flex-col"
      style={{
        paddingTop: paddingY,
        paddingBottom: paddingY,
        borderColor: borderColor as unknown as string,
        borderBottomWidth: "1px",
      }}
    >
      {/* Background layer */}
      <motion.div
        className="absolute inset-0 bg-surface/80 backdrop-blur-xl -z-10"
        style={{ opacity: bgOpacity }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-4 group">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-glow/10 text-brand-glow shadow-[inset_0_0_12px_rgba(var(--brand-glow),0.2)] border border-brand-glow/20 transition-transform duration-500 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(var(--brand-glow),0.4)]">
            <GraduationCap className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-2xl font-bold font-heading tracking-tight text-foreground">
              {siteConfig.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground font-semibold tracking-[0.2em] uppercase">
              Mathematics
            </span>
          </span>
        </Link>

        <div className="hidden lg:flex flex-1 justify-center">
          <PublicNavigation />
        </div>

        <Link
          href="/contact"
          className="hidden lg:inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-6 text-base font-semibold text-background outline-none hover:bg-foreground/90 transition-all hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-glow shadow-xl shadow-black/10"
        >
          <MapPin className="size-5" aria-hidden="true" />
          Enquire
        </Link>
      </div>
    </motion.header>
  );
}
