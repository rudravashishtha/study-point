import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, MessageCircle } from "lucide-react";

const highlights = [
  "CBSE and CISCE Mathematics",
  "ICSE for IX-X, ISC for XI-XII",
  "Mobile-first student and admin foundation",
];

export default function HomePage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-12">
      <section className="flex min-h-[58dvh] flex-col justify-center">
        <p className="text-sm font-semibold uppercase text-muted-foreground">
          Mathematics coaching
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
          Clear foundations for Classes IX-XII.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          A calm platform foundation for a local institute teaching Mathematics across
          CBSE, ICSE, and ISC curricula.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring"
          >
            View courses
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp contact
          </Link>
        </div>
      </section>
      <aside className="grid content-center gap-3">
        {highlights.map((item) => (
          <div key={item} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium">{item}</p>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg bg-[oklch(0.96_0.03_184)] p-4 text-[oklch(0.22_0.04_184)]">
            <BookOpen className="size-5" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Structured course content</p>
          </div>
          <div className="rounded-lg bg-[oklch(0.96_0.035_72)] p-4 text-[oklch(0.27_0.06_72)]">
            <CalendarDays className="size-5" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Batch and timetable ready</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
