"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterField } from "@/components/filters/filter-field";

export function DataListArchiveFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentVal = searchParams.get("archive") || "active";

  const handleChange = useCallback(
    (val: string | null) => {
      if (!val) return;
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
      <FilterField label="Status">
        <Select value={currentVal} onValueChange={handleChange} disabled={isPending}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="archived">Archived Only</SelectItem>
            <SelectItem value="all">All Records</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </div>
  );
}
