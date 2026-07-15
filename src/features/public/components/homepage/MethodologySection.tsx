import { RichText } from "@/components/editor/RichText";

export function MethodologySection({
  steps,
  isVisible,
  title,
}: {
  steps: Array<{ id: string; title: string; description: string; stepNumber: number }>;
  isVisible: boolean;
  title: string | null;
}) {
  if (!isVisible || steps.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-labelledby="methodology-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Our Approach
          </p>
          <h2
            id="methodology-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            {title || "Our Teaching Methodology"}
          </h2>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            Concept &rarr; Practice &rarr; Doubt Resolution &rarr; Test &rarr; Improvement
          </p>
        </header>
        <div className="relative">
          <div className="absolute left-8 top-0 hidden h-full w-0.5 bg-border md:block" />
          <div className="space-y-8 md:space-y-12">
            {steps.map((step) => (
              <div key={step.id} className="relative md:flex md:items-start md:gap-8">
                <div className="hidden md:flex md:size-16 md:shrink-0 md:items-center md:justify-center md:rounded-full md:border-2 md:border-primary md:bg-card md:text-2xl md:font-bold md:text-primary md:z-10">
                  {step.stepNumber}
                </div>
                <div className="rounded-xl border bg-card p-6 md:flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary md:hidden">
                      {step.stepNumber}
                    </span>
                    <h3 className="font-bold font-heading text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <RichText
                    html={step.description}
                    className="leading-relaxed text-muted-foreground"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
