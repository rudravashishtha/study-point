"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
