"use client";

import { motion } from "motion/react";
import * as React from "react";
import { useEffect, useState } from "react";

export function HeroPrototype() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const pointCount = 12;
  const points = React.useMemo(() => {
    // Deterministic random-like values for radius to satisfy React's purity rules
    const radii = [120, 145, 110, 130, 105, 150, 135, 125, 140, 115, 148, 122];
    return Array.from({ length: pointCount }).map((_, i) => {
      const angle = (i / pointCount) * Math.PI * 2;
      const radius = radii[i % radii.length];
      return {
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
      };
    });
  }, [pointCount]);

  return (
    <div className="relative w-full max-w-2xl aspect-video mx-auto overflow-hidden rounded-2xl bg-surface-elevated/40 border border-border/30 shadow-2xl backdrop-blur-3xl group">
      {/* Ambient reactive light */}
      <motion.div
        className="absolute inset-0 opacity-40 pointer-events-none"
        animate={{
          background: `radial-gradient(circle at ${50 + mousePosition.x * 20}% ${
            50 + mousePosition.y * 20
          }%, var(--brand-glow), transparent 60%)`,
        }}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
      />

      <motion.svg
        viewBox="0 0 800 600"
        className="absolute inset-0 w-full h-full"
        style={{
          rotateX: mousePosition.y * -10,
          rotateY: mousePosition.x * 10,
          transformPerspective: 1000,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="currentColor"
              className="text-border/20"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* 1. Coordinate Grid */}
        <rect width="100%" height="100%" fill="url(#grid)" />
        <motion.path
          d="M 400 0 L 400 600 M 0 300 L 800 300"
          stroke="currentColor"
          className="text-border/40"
          strokeWidth="1.5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* 2. The Single Point Appears */}
        <motion.circle
          cx="400"
          cy="300"
          r="4"
          fill="currentColor"
          className="text-brand-glow"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        />

        {/* 3. Related Points Emerge & Relationships Form */}
        {points.map((p, i) => (
          <g key={i}>
            <motion.path
              d={`M 400 300 L ${p.x} ${p.y}`}
              stroke="currentColor"
              className="text-brand-glow/40"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 1.5 + i * 0.1 }}
            />
            <motion.circle
              cx={p.x}
              cy={p.y}
              r="3"
              fill="currentColor"
              className="text-foreground/80"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 1.8 + i * 0.1 }}
            />
            <motion.text
              x={p.x + 8}
              y={p.y + 4}
              fontSize="10"
              fill="currentColor"
              className="text-muted-foreground font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 2 + i * 0.1 }}
            >
              {`(${Math.round((p.x - 400) / 40)}, ${Math.round((300 - p.y) / 40)})`}
            </motion.text>
          </g>
        ))}

        {/* 4. Curves reveal structure */}
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
          transition={{ duration: 2, delay: 3.5, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}
