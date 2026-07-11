"use client";

import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface RowError {
  column: string;
  problem: string;
  expectedValue: string;
}

interface PreviewRow {
  rowNumber: number;
  status: "PENDING" | "VALID" | "WARNING" | "ERROR";
  data: Record<string, string>;
  errors?: RowError[] | null;
  warnings?: RowError[] | null;
}

interface ImportPreviewTableProps {
  rows: PreviewRow[];
  filter?: "ALL" | "VALID" | "WARNING" | "ERROR";
}

export function ImportPreviewTable({ rows, filter = "ALL" }: ImportPreviewTableProps) {
  const filtered = useMemo(() => {
    if (filter === "ALL") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const columns = useMemo(() => {
    if (rows.length === 0) return [];
    const keys = new Set<string>();
    for (const row of rows) {
      for (const key of Object.keys(row.data)) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No rows to preview
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead className="w-20">Status</TableHead>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
              <TableHead className="min-w-[200px]">Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No rows match the current filter
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const rawErrors = row.errors
                  ? Array.isArray(row.errors)
                    ? row.errors
                    : []
                  : [];
                const rawWarnings = row.warnings
                  ? Array.isArray(row.warnings)
                    ? row.warnings
                    : []
                  : [];
                const hasIssues = rawErrors.length > 0 || rawWarnings.length > 0;

                return (
                  <TableRow
                    key={row.rowNumber}
                    className={
                      row.status === "ERROR"
                        ? "bg-destructive/5"
                        : row.status === "WARNING"
                          ? "bg-amber-50/50"
                          : ""
                    }
                  >
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {row.rowNumber}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="max-w-[160px]">
                        <div className="truncate text-sm" title={row.data[col] || ""}>
                          {row.data[col] || "-"}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>
                      {hasIssues ? (
                        <div className="space-y-1">
                          {rawErrors.map((e, i) => (
                            <div
                              key={`e-${i}`}
                              className="flex items-start gap-1 text-xs text-destructive"
                            >
                              <AlertCircle className="size-3 mt-0.5 shrink-0" />
                              <span>
                                <strong>{e.column}:</strong> {e.problem}
                              </span>
                            </div>
                          ))}
                          {rawWarnings.map((w, i) => (
                            <div
                              key={`w-${i}`}
                              className="flex items-start gap-1 text-xs text-amber-600"
                            >
                              <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                              <span>
                                <strong>{w.column}:</strong> {w.problem}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "VALID":
      return (
        <Badge
          variant="default"
          className="bg-green-500/10 text-green-700 hover:bg-green-500/20 gap-1"
        >
          <CheckCircle2 className="size-3" />
          Valid
        </Badge>
      );
    case "WARNING":
      return (
        <Badge
          variant="outline"
          className="border-amber-300 text-amber-700 bg-amber-50 gap-1"
        >
          <AlertTriangle className="size-3" />
          Warning
        </Badge>
      );
    case "ERROR":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="size-3" />
          Error
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
