"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, XCircle } from "lucide-react";
import { FileUploadUsageCategory, FileUploadScope } from "@prisma/client";

interface StudyMaterialUploadProps {
  usageCategory: FileUploadUsageCategory;
  uploadScope: FileUploadScope;
  targetBatchId?: string | null;
  targetSessionId?: string | null;
  targetTrackId?: string | null;
  onUploadSuccess: (fileAssetId: string) => void;
  onUploadError: (error: string) => void;
}

export function StudyMaterialUpload({
  usageCategory,
  uploadScope,
  targetBatchId,
  targetSessionId,
  targetTrackId,
  onUploadSuccess,
  onUploadError,
}: StudyMaterialUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "intent" | "uploading" | "finalizing" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      if (selected.size > 50 * 1024 * 1024) {
        setErrorMsg("File exceeds 50MB limit");
        return;
      }
      setFile(selected);
      setErrorMsg(null);
      setStatus("idle");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setStatus("intent");
    setErrorMsg(null);

    try {
      const intentRes = await fetch("/api/upload/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          usageCategory,
          uploadScope,
          targetBatchId,
          targetSessionId,
          targetTrackId,
        }),
      });

      if (!intentRes.ok) {
        const err = await intentRes.json();
        throw new Error(err.error || "Failed to create upload intent");
      }

      const intent = await intentRes.json();
      const { fileAssetId, uploadUrl } = intent;

      setStatus("uploading");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file to storage");
      }

      setStatus("finalizing");
      const finalizeRes = await fetch("/api/upload/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileAssetId }),
      });

      if (!finalizeRes.ok) {
        const err = await finalizeRes.json();
        throw new Error(err.error || "Failed to finalize upload");
      }

      setStatus("success");
      onUploadSuccess(fileAssetId);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      onUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center space-y-4">
      {status === "success" ? (
        <div className="text-green-600 flex items-center space-x-2">
          <span>Upload complete!</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Select a file to upload (Max 50MB)
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm"
          />
          {file && (
            <Button onClick={handleUpload} disabled={uploading} className="w-full mt-4">
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? `Status: ${status}` : "Upload File"}
            </Button>
          )}
          {errorMsg && (
            <div className="text-red-500 text-sm flex items-center space-x-1">
              <XCircle className="w-4 h-4" />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
