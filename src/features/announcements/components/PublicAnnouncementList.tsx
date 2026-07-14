"use client";

import { AnnouncementPriority } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/editor/RichText";

const priorityMeta: Record<AnnouncementPriority, { label: string; className: string }> = {
  NORMAL: { label: "Normal", className: "bg-gray-100 text-gray-800" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgent", className: "bg-red-100 text-red-800" },
};

interface PublicAnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: string;
  priority: string;
  publishedAt?: string | Date | null;
  archivedAt?: string | Date | null;
  expiresAt?: string | Date | null;
}

export function PublicAnnouncementList({
  announcements,
}: {
  announcements: PublicAnnouncementItem[];
}) {
  const visible = announcements.filter((a) => {
    if (a.audience !== "PUBLIC") return false;
    if (!a.publishedAt) return false;
    if (a.archivedAt) return false;
    if (a.expiresAt && new Date(a.expiresAt) <= new Date()) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="grid gap-4">
      {visible.map((a) => {
        const priority =
          priorityMeta[a.priority as AnnouncementPriority] || priorityMeta.NORMAL;
        return (
          <div key={a.id} className="rounded-lg border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold leading-tight">{a.title}</h2>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 rounded-full text-xs font-medium",
                  priority.className,
                )}
              >
                {priority.label}
              </Badge>
            </div>

            <RichText html={a.content} className="mt-3 text-sm leading-6" />

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {a.publishedAt && (
                <span>
                  Published{" "}
                  {new Date(a.publishedAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
              {a.expiresAt && (
                <span>
                  Expires{" "}
                  {new Date(a.expiresAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
