"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"],
  });

  // Parallax the background points up as we scroll down into the section
  const yParallax = useTransform(scrollYProgress, [0, 1], [200, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 1]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[80dvh] flex flex-col items-center justify-center overflow-hidden bg-background py-24 px-4 sm:px-6"
    >
      {/* 1. Spatial Return Background */}
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ y: yParallax, opacity }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-surface-elevated),var(--color-surface)_70%)] opacity-80" />

        {/* SVG Math Grid Return */}
        <svg
          viewBox="-400 -300 800 600"
          className="absolute inset-0 w-full h-full opacity-30"
        >
          <defs>
            <pattern
              id="ctaGrid"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
              x="-30"
              y="-30"
            >
              <path
                d="M 60 0 L 0 0 0 60"
                fill="none"
                stroke="var(--color-brand-glow)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#ctaGrid)" />

          {/* Converging points */}
          <path
            d="M -200 -150 L 0 0 M 200 -100 L 0 0 M -150 150 L 0 0 M 250 100 L 0 0"
            stroke="var(--color-border)"
            strokeDasharray="4 4"
          />
          <circle cx="-200" cy="-150" r="3" fill="var(--color-brand-glow)" />
          <circle cx="200" cy="-100" r="3" fill="var(--color-brand-glow)" />
          <circle cx="-150" cy="150" r="3" fill="var(--color-brand-glow)" />
          <circle cx="250" cy="100" r="3" fill="var(--color-brand-glow)" />

          {/* Central Point */}
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="var(--color-brand-glow)"
            className="animate-pulse"
          />
          <circle
            cx="0"
            cy="0"
            r="24"
            fill="none"
            stroke="var(--color-brand-glow)"
            strokeWidth="1"
            opacity="0.5"
          />
        </svg>

        {/* Ambient Light */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_400px_at_center,var(--brand-glow),transparent_60%)] mix-blend-screen opacity-20" />
      </motion.div>

      {/* 2. Content */}
      <motion.div
        className="relative z-10 max-w-3xl mx-auto text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold font-heading mb-6 tracking-tight drop-shadow-xl">
          Ready to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-brand-glow to-foreground">
            understand?
          </span>
        </h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto font-medium drop-shadow">
          Join us and build a mathematical foundation that lasts a lifetime.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/courses"
            className="group relative inline-flex h-14 items-center justify-center gap-3 rounded-full bg-brand-glow px-10 text-lg font-bold text-white shadow-[0_0_40px_rgba(var(--brand-glow),0.5)] transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-foreground overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative">Explore Courses</span>
            <ArrowRight className="relative size-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/contact"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-border/60 bg-surface/50 backdrop-blur-md px-10 text-lg font-bold text-foreground transition-colors hover:bg-surface-interactive hover:border-brand-glow focus-visible:ring-2 focus-visible:ring-brand-glow"
          >
            Contact Admissions
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
