"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold">This view could not load.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Try again. If the problem remains, the server logs should have the safe
          diagnostic details.
        </p>
        <Button type="button" className="mt-6" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Retry
        </Button>
      </section>
    </main>
  );
}
