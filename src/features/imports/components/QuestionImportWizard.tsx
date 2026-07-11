"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { ImportPreviewTable } from "./ImportPreviewTable";
import { ImportResults } from "./ImportResults";
import { LoadingState } from "@/components/feedback/loading-state";
import { toast } from "sonner";

type WizardStep =
  "template" | "upload" | "validating" | "preview" | "confirming" | "results";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface ImportSummary {
  importJobId: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  importedRows: number;
  failedRows: number;
  skippedRows: number;
  status: string;
}

interface PreviewRow {
  rowNumber: number;
  status: "PENDING" | "VALID" | "WARNING" | "ERROR";
  data: Record<string, string>;
  errors?: Array<{ column: string; problem: string; expectedValue: string }> | null;
  warnings?: Array<{ column: string; problem: string; expectedValue: string }> | null;
}

type StatusFilter = "ALL" | "VALID" | "WARNING" | "ERROR";

export function QuestionImportWizard() {
  const [step, setStep] = useState<WizardStep>("template");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [results, setResults] = useState<ImportSummary | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);

  const reset = useCallback(() => {
    setStep("template");
    setFile(null);
    setImportJobId(null);
    setSummary(null);
    setRows([]);
    setResults(null);
    setFilter("ALL");
    setConfirming(false);
    setImporting(false);
    submitLockRef.current = false;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/imports/question/template");
      if (!res.ok) {
        toast.error("Failed to download template");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "question-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Unsupported file type. Please upload .xlsx, .xls, or .csv files.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 5 MB limit.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || submitLockRef.current) return;

    submitLockRef.current = true;
    setImporting(true);
    setStep("validating");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("importType", "QUESTION");

      const res = await fetch("/api/imports/question/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Upload failed");
        setStep("upload");
        submitLockRef.current = false;
        setImporting(false);
        return;
      }

      setImportJobId(data.importJobId);
      setSummary(data.summary);

      const previewRes = await fetchPreviewRows(data.importJobId);
      if (previewRes) {
        setRows(previewRes);
      }

      if (data.summary.status === "READY" || data.summary.status === "FAILED") {
        setStep("preview");
      } else {
        setStep("upload");
      }
    } catch {
      toast.error("Upload failed. Please try again.");
      setStep("upload");
    } finally {
      submitLockRef.current = false;
      setImporting(false);
    }
  };

  const fetchPreviewRows = async (jobId: string): Promise<PreviewRow[] | null> => {
    try {
      const res = await fetch(`/api/imports/${jobId}/validate`, {
        method: "POST",
      });
      if (!res.ok) return null;
      const data = await res.json();

      if (data.summary) {
        setSummary(data.summary);
      }

      return fetchRowsFromJob(jobId);
    } catch {
      return null;
    }
  };

  const fetchRowsFromJob = async (jobId: string): Promise<PreviewRow[] | null> => {
    try {
      const errRes = await fetch(`/api/imports/${jobId}/errors`);
      if (errRes.ok) {
        const errData = await errRes.json();
        if (errData.errors && Array.isArray(errData.errors)) {
          return errData.errors.map((e: any) => ({
            rowNumber: e.rowNumber,
            status: "ERROR" as const,
            data: e.data,
            errors: e.problems,
          }));
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleConfirm = async () => {
    if (!importJobId || submitLockRef.current) return;

    submitLockRef.current = true;
    setConfirming(true);
    setStep("confirming");

    try {
      const res = await fetch(`/api/imports/${importJobId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed");
        setStep("preview");
        submitLockRef.current = false;
        setConfirming(false);
        return;
      }

      setResults({
        importJobId: importJobId,
        totalRows: data.summary.totalRows ?? 0,
        validRows: data.summary.validRows ?? 0,
        warningRows: data.summary.warningRows ?? 0,
        errorRows: data.summary.errorRows ?? 0,
        importedRows: data.summary.importedRows ?? 0,
        failedRows: data.summary.failedRows ?? 0,
        skippedRows: data.summary.skippedRows ?? 0,
        status: data.summary.status,
      });
      setStep("results");
      toast.success(`Imported ${data.summary.importedRows} question(s) successfully.`);
    } catch {
      toast.error("Import confirmation failed.");
      setStep("preview");
    } finally {
      submitLockRef.current = false;
      setConfirming(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!importJobId) return;
    try {
      const res = await fetch(`/api/imports/${importJobId}/errors`);
      if (!res.ok) {
        toast.error("Failed to download error report");
        return;
      }
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `import-errors-${importJobId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download error report");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const isReady = summary?.status === "READY";
  const validCount = summary?.validRows || 0;
  const errorCount = summary?.errorRows || 0;
  const warningCount = summary?.warningRows || 0;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <StepDot step={step} current="template" label="Template" />
        <StepArrow />
        <StepDot step={step} current="upload" label="Upload" />
        <StepArrow />
        <StepDot step={step} current="validating" label="Validate" />
        <StepArrow />
        <StepDot step={step} current="preview" label="Preview" />
        <StepArrow />
        <StepDot step={step} current="confirming" label="Confirm" />
        <StepArrow />
        <StepDot step={step} current="results" label="Results" />
      </div>

      {/* Step 1: Template */}
      {step === "template" && (
        <div className="space-y-4">
          <div className="rounded-md border bg-card p-6 text-center space-y-4">
            <FileSpreadsheet className="mx-auto size-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">Download Import Template</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download the template, fill in question data, and upload the file in the
                next step.
              </p>
            </div>
            <Button onClick={handleDownloadTemplate}>
              <Download className="size-4 mr-1" />
              Download Template (XLSX)
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep("upload")}>
              I have my file ready
              <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === "upload" && (
        <div className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-md border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/40"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto size-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              {file ? file.name : "Drop your file here, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: .xlsx, .xls, .csv (max 5 MB)
            </p>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
          </div>

          {file && (
            <div className="flex items-center justify-between rounded-md border bg-card p-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
                <Button size="sm" onClick={handleUpload}>
                  Upload & Validate
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("template")}>
              Back to template
            </Button>
            {!file && (
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="size-4 mr-1" />
                Download template
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Validating */}
      {step === "validating" && (
        <div className="space-y-4">
          <LoadingState label={`${importing ? "Uploading" : "Validating"} file...`} />
          <div className="text-center text-sm text-muted-foreground">
            {importing ? "Uploading file to server..." : "Parsing and validating rows..."}
          </div>
        </div>
      )}

      {/* Step 4: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Summary badges */}
          {summary && (
            <div className="flex flex-wrap gap-3">
              <Badge
                variant="default"
                className="bg-green-500/10 text-green-700 hover:bg-green-500/20 gap-1"
              >
                <CheckCircle2 className="size-3" />
                {validCount} valid
              </Badge>
              {warningCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-300 text-amber-700 bg-amber-50 gap-1"
                >
                  <AlertTriangle className="size-3" />
                  {warningCount} warnings
                </Badge>
              )}
              {errorCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="size-3" />
                  {errorCount} errors
                </Badge>
              )}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["ALL", "VALID", "WARNING", "ERROR"] as StatusFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>

          <ImportPreviewTable rows={rows} filter={filter} />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {isReady
                ? `${validCount} valid question(s) ready to import`
                : "No valid rows to import"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
              <Button onClick={handleConfirm} disabled={!isReady || confirming}>
                {confirming ? (
                  <>
                    <Loader2 className="size-4 mr-1 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Eye className="size-4 mr-1" />
                    Import {validCount} question(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirming */}
      {step === "confirming" && <LoadingState label="Importing questions..." />}

      {/* Step 6: Results */}
      {step === "results" && results && (
        <ImportResults
          results={{
            ...results,
            completedAt: new Date().toISOString(),
          }}
          filename={file?.name || ""}
          onDownloadErrors={handleDownloadErrors}
          onStartNew={reset}
          onBack={() => (window.location.href = "/admin/imports")}
        />
      )}
    </div>
  );
}

const STEP_ORDER: WizardStep[] = [
  "template",
  "upload",
  "validating",
  "preview",
  "confirming",
  "results",
];

function StepDot({
  step,
  current,
  label,
}: {
  step: WizardStep;
  current: WizardStep;
  label: string;
}) {
  const active = STEP_ORDER.indexOf(step) <= STEP_ORDER.indexOf(current);
  return (
    <span
      className={`flex items-center gap-1 text-xs font-medium ${
        active ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          active ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      />
      {label}
    </span>
  );
}

function StepArrow() {
  return <span className="text-muted-foreground/30 text-xs">▸</span>;
}
