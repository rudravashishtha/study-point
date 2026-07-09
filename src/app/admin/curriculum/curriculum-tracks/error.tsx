"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[400px] w-full items-center justify-center">
      <div className="flex max-w-[400px] flex-col items-center space-y-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold tracking-tight">Something went wrong</h3>
          <p className="text-sm text-muted-foreground">
            {error.message || "Failed to load curriculum tracks."}
          </p>
        </div>
        <Button onClick={() => reset()} variant="outline">
          Try again
        </Button>
      </div>
    </div>
  );
}
