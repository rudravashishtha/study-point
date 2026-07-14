import * as React from "react";
import { cn } from "@/lib/utils";

interface FilterFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
}

export function FilterField({
  label,
  className,
  children,
  ...props
}: FilterFieldProps) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props}>
      <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        {label}
      </p>
      {children}
    </div>
  );
}
