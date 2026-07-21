"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { PaymentOptions, type PublicPaymentPlan } from "../PaymentOptions";

interface BatchData {
  id: string;
  name: string;
  curriculumTrack: {
    id: string;
    displayName: string;
    classLevel: string;
    subject: { name: string };
  };
  feePlans: PublicPaymentPlan[];
}

export function CurrentBatchesSection({
  batches,
  isVisible,
}: {
  batches: BatchData[];
  isVisible: boolean;
}) {
  if (!isVisible || batches.length === 0) return null;

  return (
    <section
      className="bg-muted/30 py-16 md:py-24"
      aria-labelledby="current-batches-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Current Batches
          </p>
          <h2
            id="current-batches-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            Open for Admissions
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Enrolments open for the current academic session. Limited seats per batch.
          </p>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {batches.slice(0, 6).map((batch, index) => (
            <motion.article
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="size-4" aria-hidden="true" />
                <span>{batch.curriculumTrack.subject.name}</span>
                <span aria-hidden="true">•</span>
                <span>Class {batch.curriculumTrack.classLevel}</span>
              </div>

              <h3 className="mb-1 text-lg font-bold font-heading text-foreground">
                {batch.name}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {batch.curriculumTrack.displayName}
              </p>

              <div className="mt-auto space-y-3">
                {batch.feePlans.length > 0 ? (
                  <PaymentOptions plans={batch.feePlans} />
                ) : null}

                <Link
                  href="/admissions"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Enquire Now
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>

        {batches.length > 6 && (
          <div className="mt-10 text-center">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View All Batches
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
