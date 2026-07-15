"use client";

export default function TeacherActivationError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Activation</h1>
      </div>
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Failed to load teacher activation queue."}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
