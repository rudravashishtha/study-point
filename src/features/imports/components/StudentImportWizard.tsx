"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
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

// Need to import FileUploadDropzone at the top
import { FileUploadDropzone } from "@/components/upload/FileUploadDropzone";

// ... skipping to the middle of the file ...

export function StudentImportWizard() {
  const [step, setStep] = useState<WizardStep>("template");
  const [file, setFile] = useState<File | null>(null);
  const [importJobId, setImportJobId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [results, setResults] = useState<ImportSummary | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [confirming, setConfirming] = useState(false);
  const [importing, setImporting] = useState(false);
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
  }, []);

  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch("/api/imports/template/student");
      if (!res.ok) {
        toast.error("Error", { description: "Failed to download template" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "student-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error", { description: "Failed to download template" });
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      return;
    }

    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      toast.error("Error", { description: "Unsupported file type. Please upload .xlsx, .xls, or .csv files." });
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("Error", { description: "File size exceeds 5 MB limit." });
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

      const res = await fetch("/api/imports/upload/student", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Error", { description: data.error || "Upload failed" });
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
      toast.error("Error", { description: "Upload failed. Please try again." });
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
          return errData.errors.map(
            (e: {
              rowNumber: number;
              data: Record<string, string>;
              problems: Array<{ column: string; problem: string; expectedValue: string }>;
            }) => ({
              rowNumber: e.rowNumber,
              status: "ERROR" as const,
              data: e.data,
              errors: e.problems,
            }),
          );
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

    const toastId = toast.loading("Importing students...");
    try {
      const res = await fetch(`/api/imports/${importJobId}/confirm`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error("Error", { description: data.error || "Import failed", id: toastId });
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
      toast.success("Success", { description: `Imported ${data.summary.importedRows} student(s) successfully.`, id: toastId });
    } catch {
      toast.error("Error", { description: "Import confirmation failed.", id: toastId });
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
        toast.error("Error", { description: "Failed to download error report" });
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
      toast.error("Error", { description: "Failed to download error report" });
    }
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
                Download the template, fill in student data, and upload the file in the
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
          <FileUploadDropzone
            title="Upload Student Data"
            helperText="Supported formats: .xlsx, .xls, .csv (max 5 MB)"
            accept=".xlsx,.xls,.csv"
            file={file}
            onFileChange={handleFileChange}
            onUpload={handleUpload}
            uploading={importing}
            status={importing ? "uploading" : "idle"}
            uploadButtonText="Upload & Validate"
          />

          <div className="flex justify-between mt-4">
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
                ? `${validCount} valid student(s) ready to import`
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
                    Import {validCount} student(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirming */}
      {step === "confirming" && <LoadingState label="Importing students..." />}

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
