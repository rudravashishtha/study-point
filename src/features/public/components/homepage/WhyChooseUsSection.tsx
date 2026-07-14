import { Award, BookOpen, Users, Target, type LucideIcon } from "lucide-react";
import { RichText } from "@/components/editor/RichText";

const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  BookOpen,
  Users,
  Target,
};

export function WhyChooseUsSection({
  items,
  isVisible,
  title,
}: {
  items: Array<{ id: string; title: string; description: string; iconName: string | null }>;
  isVisible: boolean;
  title: string | null;
}) {
  if (!isVisible || items.length === 0) return null;

  return (
    <section className="bg-muted/30 py-16 md:py-24" aria-labelledby="why-choose-us-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Why Study Point
          </p>
          <h2
            id="why-choose-us-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            {title || "Why Choose Study Point?"}
          </h2>
        </header>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.iconName ? ICON_MAP[item.iconName] : null;
            return (
              <div key={item.id} className="group rounded-xl border bg-card p-6 text-center transition-shadow hover:shadow-md">
                {Icon && (
                  <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-6" aria-hidden="true" />
                  </div>
                )}
                <h3 className="mb-2 font-bold font-heading text-foreground">{item.title}</h3>
                <RichText html={item.description} className="text-sm leading-relaxed text-muted-foreground" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
