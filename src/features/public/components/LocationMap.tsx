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
      <div className="pointer-events-none [&_iframe]:pointer-events-auto">
        <iframe
          src={mapEmbedSrc}
          title={`${instituteName} location map`}
          loading="lazy"
          className="h-72 w-full rounded-xl border border-border"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
