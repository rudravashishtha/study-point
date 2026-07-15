"use client";

import { useState, useMemo } from "react";
import { Search, FileText, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PublicResourceCard, getResourceTypeMeta } from "./PublicResourceCard";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  visibility: string;
  publishedAt: Date | null;
  externalLinkUrl: string | null;
  fileAssetId: string | null;
  fileName: string | null;
}

const RESOURCE_TYPES = ["DOCUMENT", "PRESENTATION", "IMAGE", "LINK", "TEXT"];

export function ResourcesSearchClient({
  resources: initialResources,
  searchEnabled,
}: {
  resources: Resource[];
  searchEnabled: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  const resources = useMemo(() => {
    let filtered = initialResources;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)),
      );
    }
    if (selectedTypes.size > 0) {
      filtered = filtered.filter((r) => selectedTypes.has(r.resourceType));
    }
    return filtered;
  }, [initialResources, searchQuery, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const grouped = RESOURCE_TYPES.map((type) => ({
    type,
    items: resources.filter((r) => r.resourceType === type),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      {searchEnabled && (
        <div className="mx-auto mb-8 max-w-2xl space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search resources"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {RESOURCE_TYPES.map((type) => {
              const meta = getResourceTypeMeta(type);
              const isActive = selectedTypes.has(type);
              return (
                <Button
                  key={type}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(type)}
                  className="gap-1.5"
                >
                  <Filter className="size-3" aria-hidden="true" />
                  {meta.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <div className="mx-auto max-w-md py-12 text-center">
          <FileText
            className="mx-auto size-12 text-muted-foreground/50"
            aria-hidden="true"
          />
          <p className="mt-4 text-muted-foreground">
            {searchQuery || selectedTypes.size > 0
              ? "No resources match your search. Try different keywords or filters."
              : "No resources published yet."}
          </p>
          {(searchQuery || selectedTypes.size > 0) && (
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery("");
                setSelectedTypes(new Set());
              }}
              className="mt-2"
            >
              Clear all filters
            </Button>
          )}
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
    </>
  );
}
