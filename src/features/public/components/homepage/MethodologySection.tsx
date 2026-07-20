"use client";

import { RichText } from "@/components/editor/RichText";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  return <MethodologySectionInner steps={steps} title={title} />;
}

function MethodologySectionInner({
  steps,
  title,
}: {
  steps: Array<{ id: string; title: string; description: string; stepNumber: number }>;
  title: string | null;
}) {
  return (
    <section 
      className="py-16 md:py-24 relative overflow-hidden" 
      aria-labelledby="methodology-heading"
    >
      <header className="mx-auto mb-12 max-w-3xl text-center px-4 md:px-0">
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Carousel
          opts={{ loop: false, align: "center" }}
          className="w-full max-w-3xl mx-auto"
        >
          <CarouselContent>
            {steps.map((step) => (
              <CarouselItem key={step.id}>
                <div className="p-2 md:p-6">
                  <div className="rounded-[2rem] border border-white/10 bg-card/40 backdrop-blur-xl p-8 md:p-12 shadow-2xl transition-all hover:bg-card/60 flex flex-col items-center text-center">
                    <div className="mb-6 flex flex-col items-center gap-4">
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-3xl font-bold text-teal-600 dark:text-teal-400">
                        {step.stepNumber}
                      </div>
                      <h3 className="text-3xl font-bold font-heading text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <RichText
                      html={step.description}
                      className="leading-relaxed text-muted-foreground text-lg md:text-xl max-w-xl"
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:flex">
            <CarouselPrevious className="-left-12 size-12 border-white/10 bg-card/50 hover:bg-card" />
            <CarouselNext className="-right-12 size-12 border-white/10 bg-card/50 hover:bg-card" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}
