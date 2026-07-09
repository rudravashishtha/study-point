"use client";

import { motion, useScroll, useTransform, MotionValue } from "motion/react";
import { useRef, ElementType } from "react";
import { Brain, Layers, PenTool, CheckCircle, Trophy } from "lucide-react";

type StepType = { id: string; title: string; desc: string; icon: ElementType };

const steps: StepType[] = [
  {
    id: "complexity",
    title: "Complexity",
    desc: "Encountering the unknown mathematical problem.",
    icon: Brain,
  },
  {
    id: "explanation",
    title: "Explanation",
    desc: "Breaking down structure into axioms.",
    icon: Layers,
  },
  {
    id: "practice",
    title: "Practice",
    desc: "Rigorous application of the learned principles.",
    icon: PenTool,
  },
  {
    id: "review",
    title: "Review",
    desc: "Identifying and correcting foundational gaps.",
    icon: CheckCircle,
  },
  {
    id: "mastery",
    title: "Mastery",
    desc: "Profound intuition and unshakeable confidence.",
    icon: Trophy,
  },
];

function StepComponent({
  step,
  index,
  scrollYProgress,
}: {
  step: StepType;
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const stepProgress = useTransform(
    scrollYProgress,
    [index * 0.2, (index + 1) * 0.2],
    [0, 1],
  );

  return (
    <div className="relative z-10 flex flex-col items-center flex-1 w-full md:w-auto">
      <motion.div
        className="w-24 h-24 rounded-2xl bg-surface-elevated border border-border/50 flex items-center justify-center shadow-lg relative overflow-hidden group mb-6"
        style={{ opacity: useTransform(stepProgress, [0, 0.5], [0.4, 1]) }}
      >
        <motion.div
          className="absolute inset-0 bg-brand-glow/10"
          style={{ scale: stepProgress, opacity: stepProgress }}
        />
        <step.icon className="size-8 text-foreground group-hover:text-brand-glow transition-colors relative z-10" />
      </motion.div>

      <div className="text-center px-4 bg-surface md:bg-transparent py-2 md:py-0">
        <h3 className="text-xl font-bold font-heading mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground">{step.desc}</p>
      </div>
    </div>
  );
}

export function TeachingSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  return (
    <div ref={containerRef} className="relative w-full max-w-5xl mx-auto py-24">
      <div className="text-center mb-24">
        <h2 className="text-4xl sm:text-5xl font-bold font-heading mb-6 tracking-tight">
          The Path to Mastery
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We do not teach shortcuts. We teach a structured process that transforms
          confusion into profound mathematical intuition.
        </p>
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-12 md:gap-4">
        {/* Connecting Line (Background) */}
        <div className="absolute left-1/2 md:left-0 top-0 md:top-12 bottom-0 md:bottom-auto w-0.5 md:w-full h-full md:h-0.5 bg-border/40 -translate-x-1/2 md:translate-x-0 z-0" />

        {/* Connecting Line (Animated Progress) */}
        <motion.div
          className="absolute left-1/2 md:left-0 top-0 md:top-12 bottom-0 md:bottom-auto w-0.5 md:w-full h-full md:h-0.5 bg-brand-glow origin-top md:origin-left -translate-x-1/2 md:translate-x-0 z-0 shadow-[0_0_10px_rgba(var(--brand-glow),0.5)]"
          style={{ scaleY: scrollYProgress, scaleX: scrollYProgress }}
        />

        {steps.map((step, index) => (
          <StepComponent
            key={step.id}
            step={step}
            index={index}
            scrollYProgress={scrollYProgress}
          />
        ))}
      </div>
    </div>
  );
}
