import { format } from "date-fns";
import {
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const RESOURCE_TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  DOCUMENT: { label: "Notes & PDFs", icon: FileText },
  PRESENTATION: { label: "Presentation", icon: Presentation },
  IMAGE: { label: "Image", icon: ImageIcon },
  LINK: { label: "External Link", icon: LinkIcon },
  TEXT: { label: "Article", icon: BookOpen },
};

export function getResourceTypeMeta(type: string): { label: string; icon: LucideIcon } {
  return RESOURCE_TYPE_META[type] ?? { label: type, icon: FileText };
}

export interface PublicResourceItem {
  id: string;
  title: string;
  description: string | null;
  resourceType: string;
  publishedAt: Date | null;
  fileAssetId: string | null;
  externalLinkUrl: string | null;
}

export function PublicResourceCard({ resource }: { resource: PublicResourceItem }) {
  const meta = getResourceTypeMeta(resource.resourceType);
  const Icon = meta.icon;
  const hasFile = Boolean(resource.fileAssetId);
  const hasLink = Boolean(resource.externalLinkUrl);

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border/60 bg-surface-elevated bg-card p-5 shadow-sm transition-all hover:border-brand-glow/30 hover:shadow-md">
      <div className="mb-3">
        <Badge variant="secondary" className="gap-1">
          <Icon className="size-3.5" aria-hidden="true" />
          {meta.label}
        </Badge>
      </div>

      <h3 className="mb-1 text-lg font-bold font-heading text-foreground">
        {resource.title}
      </h3>

      {resource.description && (
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {resource.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-2">
        <span className="text-xs text-muted-foreground">
          {resource.publishedAt ? format(resource.publishedAt, "dd MMM yyyy") : null}
        </span>

        {hasLink ? (
          <a
            href={resource.externalLinkUrl as string}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-glow/30 hover:bg-muted"
          >
            Open
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        ) : hasFile ? (
          <a
            href={`/api/public/materials/${resource.id}/download`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-brand-glow/30 hover:bg-muted"
          >
            Download
            <Download className="size-4" aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
