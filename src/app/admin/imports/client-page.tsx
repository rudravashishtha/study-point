"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImportHistoryTable } from "@/features/imports/components/ImportHistoryTable";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { Button } from "@/components/ui/button";
import { ImportType, ImportJobStatus } from "@prisma/client";
import { FileSpreadsheet, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

interface ImportHistoryPageClientProps {
  initialJobs: ImportJobRow[];
  total: number;
}

export function ImportHistoryPageClient({
  initialJobs,
  total,
}: ImportHistoryPageClientProps) {
  const router = useRouter();
  const [jobs] = useState(initialJobs);

  const handleView = (jobId: string, importType?: ImportType) => {
    const path =
      importType === "QUESTION"
        ? `/admin/imports/questions?jobId=${jobId}`
        : `/admin/imports/students?jobId=${jobId}`;
    window.location.href = path;
  };

  const handleDownloadErrors = async (jobId: string) => {
    try {
      const res = await fetch(`/api/imports/${jobId}/errors`);
      if (!res.ok) {
        toast.error("Error", { description: "No error report available" });
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `import-errors-${jobId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error", { description: "Failed to download error report" });
    }
  };

  const handleDeleteExpired = async () => {
    try {
      const res = await fetch("/api/imports/cleanup", { method: "DELETE" });
      if (res.ok) {
        toast.success("Success", { description: "Expired imports cleaned up" });
        router.refresh();
      } else {
        toast.error("Error", { description: "Cleanup failed" });
      }
    } catch {
      toast.error("Error", { description: "Cleanup failed" });
    }
  };

  if (jobs.length === 0 && total === 0) {
    return (
      <DataListEmpty
        title="No imports yet"
        description="Import students, questions, and other data using the bulk import system."
        action={
          <div className="flex gap-2 justify-center">
            <Link href="/admin/imports/students">
              <Button>
                <Plus className="size-4 mr-1" />
                Import students
              </Button>
            </Link>
            <Link href="/admin/imports/questions">
              <Button variant="outline">
                <Plus className="size-4 mr-1" />
                Import questions
              </Button>
            </Link>
          </div>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{total} import job(s)</div>
        <div className="flex gap-2">
          <Link href="/admin/imports/questions">
            <Button size="sm" variant="outline">
              <FileSpreadsheet className="size-4 mr-1" />
              New question import
            </Button>
          </Link>
          <Link href="/admin/imports/students">
            <Button size="sm">
              <FileSpreadsheet className="size-4 mr-1" />
              New student import
            </Button>
          </Link>
        </div>
      </div>

      <ImportHistoryTable
        jobs={jobs}
        onView={handleView}
        onDownloadErrors={handleDownloadErrors}
        onDeleteExpired={handleDeleteExpired}
        showDeleteExpired={jobs.length > 0}
      />

      <DataListPagination currentPage={1} totalItems={total} pageSize={50} />
    </div>
  );
}
