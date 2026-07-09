"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroEnvironment() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { scrollY } = useScroll();

  // Scroll parallax effects
  const yBg = useTransform(scrollY, [0, 1000], [0, 300]);
  const opacityText = useTransform(scrollY, [0, 400], [1, 0]);
  const yText = useTransform(scrollY, [0, 400], [0, 100]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pointCount = 18;
  const points = useMemo(() => {
    const radii = [
      120, 180, 240, 150, 300, 200, 260, 170, 320, 210, 280, 190, 350, 230, 290, 160, 330,
      250,
    ];
    return Array.from({ length: pointCount }).map((_, i) => {
      const angle = (i / pointCount) * Math.PI * 2;
      const radius = radii[i % radii.length];
      return {
        id: i,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    });
  }, [pointCount]);

  return (
    <section className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background">
      {/* 1. Deep Spatial Background with Parallax */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y: yBg }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-surface-elevated),var(--color-surface)_80%)] opacity-80" />

        {/* Pointer-responsive ambient light */}
        <motion.div
          className="absolute inset-0 opacity-40 mix-blend-screen"
          animate={{
            background: `radial-gradient(circle 800px at ${50 + mousePos.x * 20}% ${50 + mousePos.y * 20}%, var(--brand-glow), transparent 70%)`,
          }}
          transition={{ type: "tween", ease: "linear", duration: 0.2 }}
        />
      </motion.div>

      {/* 2. Interactive Coordinate Field (3D tilted) */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center perspective-[1200px] pointer-events-none">
        <motion.div
          className="relative w-[150vw] h-[150vh] flex items-center justify-center"
          animate={{
            rotateX: mousePos.y * -5,
            rotateY: mousePos.x * 5,
            z: mousePos.y * 20,
          }}
          transition={{ type: "spring", stiffness: 40, damping: 30 }}
        >
          <svg
            viewBox="-500 -500 1000 1000"
            className="w-full h-full opacity-60 overflow-visible"
          >
            <defs>
              <pattern
                id="heroGrid"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
                x="-50"
                y="-50"
              >
                <path
                  d="M 100 0 L 0 0 0 100"
                  fill="none"
                  stroke="currentColor"
                  className="text-border/20"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect x="-1000" y="-1000" width="2000" height="2000" fill="url(#heroGrid)" />

            {/* Axes */}
            <motion.path
              d="M -1000 0 L 1000 0 M 0 -1000 L 0 1000"
              stroke="currentColor"
              className="text-brand-glow/30"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />

            {/* The Origin Point */}
            <motion.circle
              cx="0"
              cy="0"
              r="6"
              fill="currentColor"
              className="text-brand-glow"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            />
            <motion.circle
              cx="0"
              cy="0"
              r="24"
              fill="none"
              stroke="currentColor"
              className="text-brand-glow/40"
              strokeWidth="1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
            />

            {/* Emergent Points and Relationships */}
            {points.map((p, i) => (
              <g key={p.id}>
                <motion.path
                  d={`M 0 0 L ${p.x} ${p.y}`}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, delay: 1.5 + i * 0.05 }}
                />
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="currentColor"
                  className="text-brand-glow/80"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 2 + i * 0.05 }}
                />
                <motion.text
                  x={p.x + 12}
                  y={p.y + 6}
                  fontSize="12"
                  fill="currentColor"
                  className="text-muted-foreground font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 2.2 + i * 0.05 }}
                >
                  {`(${Math.round(p.x)}, ${Math.round(-p.y)})`}
                </motion.text>
              </g>
            ))}

            {/* Emerging Mathematical Structure (Curve connecting points) */}
            <motion.path
              d={
                `M ${points[0].x} ${points[0].y} ` +
                points
                  .slice(1)
                  .map((p) => `L ${p.x} ${p.y}`)
                  .join(" ") +
                " Z"
              }
              fill="currentColor"
              className="text-brand-glow/5"
              stroke="currentColor"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 3, delay: 3, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </div>

      {/* 3. Integrated Typography and Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto pointer-events-auto"
        style={{ opacity: opacityText, y: yText }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-glow/30 bg-surface/50 backdrop-blur-md mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-glow opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-glow"></span>
          </span>
          <span className="text-sm font-semibold tracking-widest uppercase text-brand-glow">
            Classes IX-XII Admissions Open
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl font-bold font-heading leading-[1.1] tracking-tight mb-8 drop-shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Complexity becomes <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-brand-glow/80">
            understandable.
          </span>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium leading-relaxed mb-12 drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          A premium mathematics institute building profound intuition through structured
          foundations and rigorous logic.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <Link
            href="/courses"
            className="group relative inline-flex h-14 items-center justify-center gap-3 rounded-full bg-foreground px-10 text-lg font-bold text-background overflow-hidden transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-glow shadow-[0_0_40px_rgba(var(--brand-glow),0.3)]"
          >
            <span className="absolute inset-0 w-full h-full -x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative">Explore Curriculum</span>
            <ArrowRight className="relative size-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
