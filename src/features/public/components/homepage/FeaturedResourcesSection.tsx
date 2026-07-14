import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export function FeaturedResourcesSection({
  resources,
  isVisible,
  isEnabled,
}: {
  resources: Array<{
    id: string;
    title: string;
    description: string | null;
    resourceType: string;
    fileUrl: string | null;
  }>;
  isVisible: boolean;
  isEnabled: boolean;
}) {
  if (!isVisible || !isEnabled || resources.length === 0) return null;

  return (
    <section className="bg-muted/30 py-16 md:py-24" aria-labelledby="resources-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Free Resources
          </p>
          <h2
            id="resources-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            Featured Study Resources
          </h2>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((r) => (
            <Link
              key={r.id}
              href={r.fileUrl || `/resources`}
              className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <FileText className="mb-3 size-8 text-primary" aria-hidden="true" />
              <h3 className="mb-1 font-bold font-heading text-foreground group-hover:text-primary transition-colors">
                {r.title}
              </h3>
              {r.description && (
                <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {r.description}
                </p>
              )}
              <span className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                View Resource <ArrowRight className="ml-1 size-3" />
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/resources"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all resources <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
