"use client";

import { useState } from "react";
import { FileUploadDropzone } from "./FileUploadDropzone";

interface PublicAssetUploadProps {
  accept?: string;
  maxSizeMB?: number;
  onUploadSuccess: (fileAssetId: string) => void;
  title?: string;
  helperText?: string;
  className?: string;
}

export function PublicAssetUpload({
  accept,
  onUploadSuccess,
  title = "Upload Image",
  helperText = "PNG, JPG, or WebP up to 10 MB.",
  className,
}: Omit<PublicAssetUploadProps, 'maxSizeMB'>) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "intent" | "uploading" | "finalizing" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("intent");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/upload/public-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate upload");
      }

      const { fileAssetId, uploadUrl } = await res.json();
      setStatus("uploading");

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload to storage failed");
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
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
    }
  };

  return (
    <FileUploadDropzone
      title={title}
      helperText={helperText}
      accept={accept}
      file={file}
      onFileChange={(f) => {
        setFile(f);
        setStatus("idle");
        setErrorMsg(null);
      }}
      onUpload={handleUpload}
      uploading={status === "uploading" || status === "intent" || status === "finalizing"}
      status={status}
      errorMsg={errorMsg}
      uploadButtonText="Upload"
      className={className}
    />
  );
}
