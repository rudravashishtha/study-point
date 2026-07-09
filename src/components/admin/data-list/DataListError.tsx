import React from "react";

export function DataListError({
  message = "Failed to load data. Please try again.",
  retry,
}: {
  message?: string;
  retry?: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-lg font-bold text-destructive">!</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-destructive">
          Error Loading Data
        </h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">{message}</p>
        {retry && (
          <button
            onClick={retry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
