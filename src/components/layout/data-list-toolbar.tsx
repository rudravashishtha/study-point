import * as React from "react"
import { cn } from "@/lib/utils"

const DataListToolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0", className)}
      {...props}
    />
  )
)
DataListToolbar.displayName = "DataListToolbar"

const DataListFilters = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center space-x-2", className)}
      {...props}
    />
  )
)
DataListFilters.displayName = "DataListFilters"

export { DataListToolbar, DataListFilters }
