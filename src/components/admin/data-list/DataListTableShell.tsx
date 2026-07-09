import React from "react";

export function DataListTableShell({
  headers,
  children,
}: {
  headers: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="hidden w-full overflow-auto rounded-md border md:block">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {headers}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
      </table>
    </div>
  );
}
