import React from "react";

export function DataListEmpty({
  title = "No records found",
  description = "Get started by creating a new record.",
  isFiltered = false,
  filteredDescription = "Try adjusting your filters or search query.",
  action,
}: {
  title?: string;
  description?: string;
  isFiltered?: boolean;
  filteredDescription?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mb-4 mt-2 text-sm text-muted-foreground">
          {isFiltered ? filteredDescription : description}
        </p>
        {action}
      </div>
    </div>
  );
}
