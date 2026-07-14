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

interface StudentAnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  publishedAt?: string | Date | null;
  archivedAt?: string | Date | null;
  expiresAt?: string | Date | null;
}

export function StudentAnnouncementList({
  announcements,
}: {
  announcements: StudentAnnouncementItem[];
}) {
  const visible = announcements.filter((a) => {
    if (!a.publishedAt) return false;
    if (a.archivedAt) return false;
    if (a.expiresAt && new Date(a.expiresAt) <= new Date()) return false;
    return true;
  });

  if (visible.length === 0) return null;

  return (
    <div className="divide-y">
      {visible.map((a) => {
        const priority =
          priorityMeta[a.priority as AnnouncementPriority] || priorityMeta.NORMAL;
        return (
          <div key={a.id} className="flex flex-col gap-2 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold leading-tight">{a.title}</h3>
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

            <RichText html={a.content} className="text-sm" />

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
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
