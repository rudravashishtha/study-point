import { Quote } from "lucide-react";

export function TestimonialsSection({
  testimonials,
  isVisible,
  title,
}: {
  testimonials: Array<{
    id: string;
    studentName: string;
    designation: string | null;
    message: string;
    photoUrl: string | null;
  }>;
  isVisible: boolean;
  title: string | null;
}) {
  if (!isVisible || testimonials.length === 0) return null;

  return (
    <section className="bg-muted/30 py-16 md:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Testimonials
          </p>
          <h2
            id="testimonials-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            {title || "What Our Students Say"}
          </h2>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.slice(0, 6).map((t) => (
            <blockquote key={t.id} className="relative rounded-xl border bg-card p-6">
              <Quote className="absolute right-4 top-4 size-8 text-muted-foreground/20" aria-hidden="true" />
              <p className="mb-4 leading-relaxed text-muted-foreground">&ldquo;{t.message}&rdquo;</p>
              <footer>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {t.studentName.charAt(0)}
                  </div>
                  <div>
                    <cite className="not-italic font-medium text-foreground">{t.studentName}</cite>
                    {t.designation && (
                      <p className="text-xs text-muted-foreground">{t.designation}</p>
                    )}
                  </div>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
