"use client";

import { motion } from "motion/react";

export function TeacherSection() {
  return (
    <section className="bg-surface-elevated py-24 px-4 sm:px-6 lg:px-8 border-y border-border/30">
      <div className="max-w-6xl mx-auto grid md:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-center">
        {/* Temporary Editorial Visual (To be replaced by photography) */}
        <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-surface border border-border/50 shadow-2xl flex flex-col justify-between p-8 group">
          {/* Subtle math background texture */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(var(--color-foreground) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <motion.div
              className="w-12 h-1 bg-brand-glow mb-6"
              initial={{ width: 0 }}
              whileInView={{ width: 48 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
              Subject Matter Expert
            </p>
            <h3 className="text-3xl font-bold font-heading">Mathematics</h3>
          </div>

          <div className="relative z-10 space-y-6">
            <div>
              <p className="text-5xl font-bold font-heading text-brand-glow">10+</p>
              <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                Years of Teaching
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border/50">
              <div>
                <p className="font-bold text-foreground">IX - XII</p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
              <div>
                <p className="font-bold text-foreground">CBSE & CISCE</p>
                <p className="text-xs text-muted-foreground">Boards</p>
              </div>
            </div>
          </div>

          {/* Decorative mathematical annotation */}
          <div className="absolute top-8 right-8 text-brand-glow/30 font-mono text-sm transform rotate-90 origin-top-right">
            ∫(x)dx = X + C
          </div>
        </div>

        {/* Editorial Copy */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold font-heading mb-8 leading-tight">
              Mentorship led by{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-glow to-foreground">
                rigorous experience.
              </span>
            </h2>
            <div className="space-y-6 text-lg sm:text-xl leading-relaxed text-muted-foreground">
              <p>
                Mathematics is not merely a tool for calculation; it is a language of
                logic and a framework for structured thought.
              </p>
              <p>
                For over a decade, we have mentored students to not just pass
                examinations, but to genuinely appreciate the elegance of coordinate
                geometry, the utility of calculus, and the precision of algebra.
              </p>
              <p className="font-bold text-foreground pt-4 border-t border-border/30 inline-block">
                — The Director
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
