"use client";

import { Award, BookOpen, Users, Target, type LucideIcon } from "lucide-react";
import { RichText } from "@/components/editor/RichText";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

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
  items: Array<{
    id: string;
    title: string;
    description: string;
    iconName: string | null;
  }>;
  isVisible: boolean;
  title: string | null;
}) {
  if (!isVisible || items.length === 0) return null;

  return (
    <section
      className="bg-muted/30 py-16 md:py-24"
      aria-labelledby="why-choose-us-heading"
    >
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

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 lg:gap-6 auto-rows-fr">
          {items.map((item, index) => {
            const Icon = item.iconName ? ICON_MAP[item.iconName] : null;
            
            // Bento grid placement logic based on index
            let bentoClasses = "md:col-span-1 md:row-span-1";
            if (index === 0) bentoClasses = "md:col-span-2 md:row-span-2"; // Featured large card
            else if (index === 1 && items.length > 3) bentoClasses = "md:col-span-1 md:row-span-1";
            else if (index === 1 && items.length <= 3) bentoClasses = "md:col-span-1 md:row-span-2"; // Alternate wide layout
            
            // For smaller cards, keep things compact. Large card gets more breathing room.
            const isLarge = index === 0;

            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -5, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-xl hover:border-primary/30 flex flex-col justify-between gap-4",
                  bentoClasses
                )}
              >
                {/* Decorative background glow on hover */}
                <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl transition-opacity opacity-0 group-hover:opacity-100" />
                
                <div className={cn("relative z-10", isLarge ? "md:p-4" : "")}>
                  {Icon && (
                    <div className={cn(
                      "mb-4 flex items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                      isLarge ? "size-16" : "size-12"
                    )}>
                      <Icon className={cn(isLarge ? "size-8" : "size-6")} aria-hidden="true" />
                    </div>
                  )}
                  <h3 className={cn("mb-2 font-bold font-heading text-foreground", isLarge ? "text-2xl md:text-3xl" : "text-xl")}>
                    {item.title}
                  </h3>
                  <RichText
                    html={item.description}
                    className={cn(
                      "leading-relaxed text-muted-foreground",
                      isLarge ? "text-base md:text-lg" : "text-sm"
                    )}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
