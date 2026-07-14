import { format } from "date-fns";
import { Download, ExternalLink, FileText } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type StudentMaterialListItem } from "@/server/services/study-materials";

const RESOURCE_TYPE_LABEL: Record<string, string> = {
  DOCUMENT: "Document",
  PRESENTATION: "Presentation",
  IMAGE: "Image",
  LINK: "Link",
  TEXT: "Text",
};

function materialContext(item: StudentMaterialListItem): string {
  const parts = [`Class ${item.classLevel}`, item.subjectName];
  if (item.chapterName) parts.push(item.chapterName);
  if (item.topicName) parts.push(item.topicName);
  return parts.join(" · ");
}

export function StudentMaterialList({ items }: { items: StudentMaterialListItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((m) => (
        <li
          key={m.id}
          className="flex flex-col rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{m.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{materialContext(m)}</p>
            </div>
            <Badge variant="outline" className="shrink-0">
              {RESOURCE_TYPE_LABEL[m.resourceType] ?? m.resourceType}
            </Badge>
          </div>

          {m.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {m.description}
            </p>
          )}

          {m.resourceType === "TEXT" && m.textContent && (
            <div className="mt-2 rounded-md bg-muted p-3 text-sm whitespace-pre-wrap break-words">
              {m.textContent}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {m.publishedAt ? format(new Date(m.publishedAt), "MMM d, yyyy") : "—"}
            </span>
            <div className="flex items-center gap-2">
              {(m.resourceType === "DOCUMENT" ||
                m.resourceType === "PRESENTATION" ||
                m.resourceType === "IMAGE") &&
                m.fileAssetId && (
                  <a
                    href={`/api/materials/${m.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    title="Download"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                )}
              {m.resourceType === "LINK" && m.externalLinkUrl && (
                <a
                  href={m.externalLinkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  title="Open Link"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open
                </a>
              )}
              {m.resourceType === "TEXT" && (
                <span className="inline-flex items-center text-sm text-muted-foreground">
                  <FileText className="mr-2 h-4 w-4" /> Read
                </span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
