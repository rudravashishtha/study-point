"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Trash2 } from "lucide-react";
import type { ImportType, ImportJobStatus } from "@prisma/client";

interface ImportJobRow {
  id: string;
  importType: ImportType;
  originalFilename: string;
  status: ImportJobStatus;
  totalRows: number;
  validRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: Date;
  completedAt: Date | null;
  createdBy: string | null;
}

interface ImportHistoryTableProps {
  jobs: ImportJobRow[];
  onView?: (jobId: string, importType?: ImportType) => void;
  onDownloadErrors?: (jobId: string) => void;
  onDeleteExpired?: () => void;
  showDeleteExpired?: boolean;
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "ghost" | "link"
> = {
  PENDING: "secondary",
  VALIDATING: "outline",
  READY: "default",
  PROCESSING: "outline",
  COMPLETED: "default",
  COMPLETED_WITH_ERRORS: "destructive",
  FAILED: "destructive",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  VALIDATING: "Validating",
  READY: "Ready",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  COMPLETED_WITH_ERRORS: "Completed w/ Errors",
  FAILED: "Failed",
};

export function ImportHistoryTable({
  jobs,
  onView,
  onDownloadErrors,
  onDeleteExpired,
  showDeleteExpired,
}: ImportHistoryTableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No import history found
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(job.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate font-medium" title={job.originalFilename}>
                      {job.originalFilename}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {job.importType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[job.status] || "secondary"}>
                      {statusLabels[job.status] || job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <span className="text-muted-foreground">
                      {job.importedRows} / {job.totalRows}
                    </span>
                    {job.failedRows > 0 && (
                      <span className="ml-1 text-destructive">
                        ({job.failedRows} failed)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onView?.(job.id, job.importType)}
                        title="View details"
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => onDownloadErrors?.(job.id)}
                        disabled={
                          job.status !== "COMPLETED_WITH_ERRORS" &&
                          job.status !== "FAILED"
                        }
                        title="Download errors"
                      >
                        <Download className="size-4" />
                        <span className="sr-only">Download errors</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {showDeleteExpired && (
        <div className="border-t px-4 py-2">
          <Button variant="ghost" size="sm" onClick={onDeleteExpired}>
            <Trash2 className="size-3 mr-1" />
            Clean up expired imports
          </Button>
        </div>
      )}
    </div>
  );
}
