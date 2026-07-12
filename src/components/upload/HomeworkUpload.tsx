"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, XCircle } from "lucide-react";

interface HomeworkUploadProps {
  targetBatchId: string;
  onUploadSuccess: (fileAssetId: string) => void;
  onUploadError: (error: string) => void;
}

export function HomeworkUpload({
  targetBatchId,
  onUploadSuccess,
  onUploadError,
}: HomeworkUploadProps) {
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
          usageCategory: "HOMEWORK",
          uploadScope: "BATCH",
          targetBatchId,
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
    <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center space-y-3">
      {status === "success" ? (
        <div className="text-green-600 flex items-center space-x-2 text-sm">
          <span>Upload complete!</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Select a file to upload (Max 50MB)
            </p>
          </div>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-sm w-full"
          />
          {file && (
            <Button
              onClick={handleUpload}
              disabled={uploading}
              size="sm"
              className="w-full"
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? `Status: ${status}` : "Upload File"}
            </Button>
          )}
          {errorMsg && (
            <div className="text-red-500 text-xs flex items-center space-x-1">
              <XCircle className="w-3 h-3" />
              <span>{errorMsg}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
