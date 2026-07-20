"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { WhatsAppButton } from "@/features/public/components/WhatsAppButton";
import { AmbientBackground } from "@/features/public/components/AmbientBackground";
import { motion } from "motion/react";
interface HeroSectionProps {
  settings: {
    instituteName: string;
    heroHeadline: string | null;
    heroSubheadline: string | null;
    heroCtaText: string | null;
    heroCtaTarget: string | null;
    whatsappNumber: string | null;
  } | null;
}

export function HeroSection({ settings }: HeroSectionProps) {
  const headline = settings?.heroHeadline ?? "Master Coaching with Confidence";
  const subheadline =
    settings?.heroSubheadline ??
    "Concept → Practice → Doubt Resolution → Test → Improvement";
  const ctaText = settings?.heroCtaText ?? "Enquire Now";
  const ctaTarget = settings?.heroCtaTarget ?? "/admissions";

  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      <AmbientBackground />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading tracking-tight text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            {headline}
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {subheadline}
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <Link
              href={ctaTarget}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              {ctaText}
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <WhatsAppButton
              phoneNumber={settings?.whatsappNumber}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-4 text-lg font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              )}
            >
              <svg
                className="size-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="sm:inline">WhatsApp</span>
            </WhatsAppButton>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
