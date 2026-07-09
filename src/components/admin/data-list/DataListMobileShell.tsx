import React from "react";

export function DataListMobileShell({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-4 md:hidden">{children}</div>;
}
