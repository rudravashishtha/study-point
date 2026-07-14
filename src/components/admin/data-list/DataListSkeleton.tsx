import React from "react";

export function DataListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading data"
      className="w-full space-y-3 animate-in fade-in-50"
    >
      <div className="hidden md:block w-full overflow-hidden rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {Array.from({ length: 4 }).map((_, i) => (
                <th key={i} className="h-10 px-4 py-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b last:border-0">
                {Array.from({ length: 4 }).map((_, j) => (
                  <td key={j} className="p-4">
                    <div className="h-4 w-full animate-pulse rounded bg-muted/50" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col space-y-4 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-24 w-full animate-pulse rounded-md border bg-muted/20"
          />
        ))}
      </div>
    </div>
  );
}
