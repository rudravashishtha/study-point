"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

export function DataListSearch({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [inputValue, setInputValue] = useState(searchParams.get("q") || "");

  const handleSearch = useCallback(
    (term: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set("q", term);
      } else {
        params.delete("q");
      }
      params.set("page", "1"); // reset to page 1 on search

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== (searchParams.get("q") || "")) {
        handleSearch(inputValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, handleSearch, searchParams]);

  return (
    <div className="relative flex w-full max-w-sm items-center">
      <Input
        type="text"
        placeholder={placeholder}
        aria-label="Search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {isPending && (
        <span className="absolute right-3 top-2 text-xs text-muted-foreground">...</span>
      )}
    </div>
  );
}
