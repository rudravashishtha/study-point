"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface DataListPaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

export function DataListPagination({
  totalItems,
  pageSize,
  currentPage,
}: DataListPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const createPageUrl = useCallback(
    (pageNumber: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", pageNumber.toString());
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  const goToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    startTransition(() => {
      router.push(createPageUrl(pageNumber));
    });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)} to{" "}
        {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1 || isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Previous
        </button>
        <div className="text-sm font-medium">
          Page {currentPage} of {totalPages}
        </div>
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages || isPending}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}
