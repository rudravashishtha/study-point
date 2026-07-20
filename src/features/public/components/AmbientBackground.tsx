"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none -z-10", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Aurora Orbs */}
      <motion.div
        animate={{
          x: ["0%", "20%", "-10%", "0%"],
          y: ["0%", "-20%", "10%", "0%"],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] rounded-full bg-primary/20 blur-[100px] opacity-60 mix-blend-screen"
      />
      <motion.div
        animate={{
          x: ["0%", "-20%", "15%", "0%"],
          y: ["0%", "30%", "-15%", "0%"],
          scale: [1, 1.1, 0.8, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vh] rounded-full bg-blue-500/15 blur-[120px] opacity-50 mix-blend-screen"
      />
      <motion.div
        animate={{
          x: ["0%", "10%", "-10%", "0%"],
          y: ["0%", "10%", "-10%", "0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-[30%] left-[30%] w-[40vw] h-[40vh] rounded-full bg-teal-400/10 blur-[100px] opacity-40 mix-blend-screen"
      />

      {/* Subtle Grid overlay for texture */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-30" 
      />
    </div>
  );
}
