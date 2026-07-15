export function GallerySection({
  items,
  isVisible,
  title,
}: {
  items: Array<{
    id: string;
    caption: string | null;
    category: string | null;
    fileUrl: string | null;
    mimeType: string;
  }>;
  isVisible: boolean;
  title: string | null;
}) {
  if (!isVisible || items.length === 0) return null;

  return (
    <section className="py-16 md:py-24" aria-labelledby="gallery-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mx-auto mb-12 max-w-3xl text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
            Gallery
          </p>
          <h2
            id="gallery-heading"
            className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
          >
            {title || "Our Institute"}
          </h2>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, 9).map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl bg-muted"
            >
              <div className="aspect-[4/3] flex items-center justify-center bg-muted text-muted-foreground">
                {item.fileUrl ? (
                  <span className="text-xs">Image</span>
                ) : (
                  <span className="text-xs">No image</span>
                )}
              </div>
              {item.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="text-sm text-white">{item.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
