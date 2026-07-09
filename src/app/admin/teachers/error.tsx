"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeachersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
      <div className="bg-destructive/10 p-4 rounded-full mb-4">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight mb-2">Failed to load teachers</h2>
      <p className="text-muted-foreground mb-6 max-w-[500px]">
        {error.message || "An unexpected error occurred while loading the teachers list."}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
      </div>
    </div>
  );
}
