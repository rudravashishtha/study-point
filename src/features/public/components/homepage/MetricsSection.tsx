export function MetricsSection({
  metrics,
  isVisible,
}: {
  metrics: Array<{ id: string; label: string; value: string }>;
  isVisible: boolean;
}) {
  if (!isVisible || metrics.length === 0) return null;

  return (
    <section className="bg-primary py-16 md:py-20" aria-label="Institute performance metrics">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.slice(0, 4).map((metric) => (
            <div key={metric.id} className="text-center text-primary-foreground">
              <p className="text-4xl font-bold tracking-tight md:text-5xl">
                {metric.value}
              </p>
              <p className="mt-2 text-sm font-medium text-primary-foreground/80">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
