"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function DataListArchiveFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentVal = searchParams.get("archive") || "active";

  const handleChange = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val === "active") {
        params.delete("archive");
      } else {
        params.set("archive", val);
      }
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="flex items-center space-x-2">
      <select
        value={currentVal}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="active">Active Only</option>
        <option value="archived">Archived Only</option>
        <option value="all">All Records</option>
      </select>
    </div>
  );
}
