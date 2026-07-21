import { Metadata } from "next";
import { listPublicResources } from "@/server/services/study-materials";
import { getSiteSettings } from "@/server/services/site-settings";
import { ResourcesSearchClient } from "@/features/public/components/ResourcesSearchClient";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free Study Resources | Study Point",
  description:
    "Download free study materials, formula sheets, and practice resources for Classes IX-XII. No sign-up required.",
  alternates: { canonical: "/resources" },
  openGraph: { url: "/resources" },
};

export default async function ResourcesPage() {
  const [result, settingsResult] = await Promise.all([
    listPublicResources(1, 60),
    getSiteSettings(),
  ]);

  const resources = result.success ? result.data : [];
  const searchEnabled = settingsResult.success
    ? settingsResult.data.resourcesSearchEnabled
    : true;

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
              Curated study notes, formula sheets, and practice material for Classes
              IX–XII. No sign-up required.
            </p>
          </header>

          <ResourcesSearchClient resources={resources} searchEnabled={searchEnabled} />
        </div>
      </section>
    </div>
  );
}
