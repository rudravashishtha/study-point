"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  ArrowLeft,
} from "lucide-react";

interface ImportResultsData {
  importJobId: string;
  totalRows: number;
  validRows: number;
  importedRows: number;
  failedRows: number;
  skippedRows: number;
  status: string;
  completedAt?: string;
}

interface ImportResultsProps {
  results: ImportResultsData;
  filename: string;
  onDownloadErrors: () => void;
  onStartNew: () => void;
  onBack: () => void;
}

export function ImportResults({
  results,
  filename,
  onDownloadErrors,
  onStartNew,
  onBack,
}: ImportResultsProps) {
  const hasErrors = results.failedRows > 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ${
            hasErrors ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
          }`}
        >
          {hasErrors ? (
            <AlertTriangle className="size-8" />
          ) : (
            <CheckCircle2 className="size-8" />
          )}
        </div>
        <h2 className="text-xl font-semibold">
          {hasErrors ? "Import completed with errors" : "Import completed successfully"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {filename} — {new Date().toLocaleDateString("en-GB")}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ImportStat
          icon={<CheckCircle2 className="size-4 text-green-600" />}
          label="Imported"
          value={results.importedRows}
        />
        <ImportStat
          icon={<XCircle className="size-4 text-destructive" />}
          label="Failed"
          value={results.failedRows}
        />
        <ImportStat
          icon={<AlertTriangle className="size-4 text-amber-600" />}
          label="Skipped"
          value={results.skippedRows}
        />
        <ImportStat
          icon={<Clock className="size-4 text-muted-foreground" />}
          label="Total"
          value={results.totalRows}
        />
      </div>

      <div className="rounded-md border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Status</span>
          <Badge variant={hasErrors ? "destructive" : "default"}>{results.status}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Valid rows</span>
          <span>{results.validRows}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back to history
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          {hasErrors && (
            <Button variant="destructive" onClick={onDownloadErrors}>
              <Download className="size-4 mr-1" />
              Download error report
            </Button>
          )}
          <Button onClick={onStartNew}>
            <Plus className="size-4 mr-1" />
            Start new import
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImportStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border bg-card p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
