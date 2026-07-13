import { MapPin, Navigation } from "lucide-react";

interface LocationMapProps {
  instituteName: string;
  address?: string | null;
  mapUrl?: string | null;
  className?: string;
}

export function LocationMap({
  instituteName,
  address,
  mapUrl,
  className,
}: LocationMapProps) {
  const mapQuery = address || mapUrl || instituteName;
  const mapEmbedSrc = mapUrl?.includes("/embed")
    ? mapUrl
    : `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  if (!mapUrl) {
    return (
      <div
        className={`flex h-72 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground ${className ?? ""}`}
      >
        Map not configured
      </div>
    );
  }

  return (
    <div className={className}>
      <iframe
        src={mapEmbedSrc}
        title={`${instituteName} location map`}
        loading="lazy"
        className="h-72 w-full rounded-xl border border-border"
        allowFullScreen
      />
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MapPin className="size-4" aria-hidden="true" />
          Open in Google Maps
        </a>
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-accent"
        >
          <Navigation className="size-4" aria-hidden="true" />
          Get Directions
        </a>
      </div>
    </div>
  );
}
