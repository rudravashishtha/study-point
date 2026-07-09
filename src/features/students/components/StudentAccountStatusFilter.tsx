"use client";

import React, { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function StudentAccountStatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("accountStatus") || "all";

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());

      // Reset to page 1 on filter change
      params.delete("page");

      if (value === "all") {
        params.delete("accountStatus");
      } else {
        params.set("accountStatus", value);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Filter by account status"
    >
      <option value="all">All Accounts</option>
      <option value="none">No Account</option>
      <option value="invited">Invited</option>
      <option value="active">Active</option>
      <option value="disabled">Disabled</option>
    </select>
  );
}
