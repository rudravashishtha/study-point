"use client";

import { useState } from "react";
import { FileUploadUsageCategory, FileUploadScope } from "@prisma/client";
import { FileUploadDropzone } from "./FileUploadDropzone";

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

  const handleFileChange = (selected: File | null) => {
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        setErrorMsg("File exceeds 50MB limit");
        return;
      }
      setFile(selected);
      setErrorMsg(null);
      setStatus("idle");
    } else {
      setFile(null);
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
    <FileUploadDropzone
      title="Upload Study Material"
      helperText="Click anywhere or drag & drop your file here.\nMaximum size: 50 MB"
      file={file}
      onFileChange={handleFileChange}
      onUpload={handleUpload}
      uploading={uploading}
      status={status}
      errorMsg={errorMsg}
      disabled={uploading}
    />
  );
}
