import { Metadata } from "next";
import { FileText } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { listPublicResources } from "@/server/services/study-materials";
import {
  PublicResourceCard,
  getResourceTypeMeta,
} from "@/features/public/components/PublicResourceCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free Study Resources | Study Point Mathematics",
  description:
    "Download free mathematics study materials, formula sheets, and practice resources for Classes IX–XII. No sign-up required.",
  alternates: { canonical: "/resources" },
  openGraph: { url: "/resources" },
};

const GROUP_ORDER = ["DOCUMENT", "PRESENTATION", "IMAGE", "LINK", "TEXT"];

export default async function ResourcesPage() {
  const result = await listPublicResources(1, 60);
  const resources = result.success ? result.data : [];

  const grouped = GROUP_ORDER.map((type) => ({
    type,
    items: resources.filter((r) => r.resourceType === type),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-0">
      <section className="bg-muted/30 py-12 md:py-20" aria-labelledby="resources-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Free Resources
            </p>
            <h1
              id="resources-heading"
              className="mb-4 text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl lg:text-5xl"
            >
              Free Study Resources
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Curated mathematics notes, formula sheets, and practice material for Classes
              IX–XII. No sign-up required.
            </p>
          </header>

          {grouped.length === 0 ? (
            <div className="mx-auto max-w-md">
              <EmptyState
                icon={FileText}
                title="No resources published yet"
                description="Free study resources will be published here soon. Please check back later."
              />
            </div>
          ) : (
            grouped.map((group) => {
              const meta = getResourceTypeMeta(group.type);
              const Icon = meta.icon;
              return (
                <section
                  key={group.type}
                  className="mb-12"
                  aria-labelledby={`group-${group.type}`}
                >
                  <div className="mb-5 flex items-center gap-2">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <h2
                      id={`group-${group.type}`}
                      className="text-xl font-bold font-heading text-foreground md:text-2xl"
                    >
                      {meta.label}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      ({group.items.length})
                    </span>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((resource) => (
                      <PublicResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
