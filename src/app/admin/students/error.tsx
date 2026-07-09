"use client";

import { DataListError } from "@/components/admin/data-list/DataListError";
import { useEffect } from "react";

export default function StudentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Students page error:", error);
  }, [error]);

  return <DataListError message={error.message} retry={reset} />;
}
