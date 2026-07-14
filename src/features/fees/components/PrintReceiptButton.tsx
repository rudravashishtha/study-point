"use client";

import { Printer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <Printer className="mr-2 size-4" /> Print
    </button>
  );
}
