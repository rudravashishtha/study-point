import { cn } from "@/lib/utils";

/**
 * Renders rich-text HTML that has ALREADY been sanitized server-side via
 * `sanitizeRichText`. This component does not sanitize, so it must only be
 * given trusted (pre-sanitized) HTML — all public render paths receive content
 * from `getPublicWebsiteData` / the announcements service, which sanitize on
 * read and on write.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "prose prose-sm sm:prose-base dark:prose-invert max-w-none",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
