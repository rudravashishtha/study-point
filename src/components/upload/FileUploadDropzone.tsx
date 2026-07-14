"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadCloud, File, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadDropzoneProps {
  title?: string;
  helperText?: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onUpload?: () => void;
  uploading?: boolean;
  status?: "idle" | "intent" | "uploading" | "finalizing" | "success" | "error";
  errorMsg?: string | null;
  disabled?: boolean;
  className?: string;
  uploadButtonText?: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUploadDropzone({
  title = "Upload File",
  helperText = "Click anywhere or drag & drop your file here.",
  accept,
  file,
  onFileChange,
  onUpload,
  uploading = false,
  status = "idle",
  errorMsg = null,
  disabled = false,
  className,
  uploadButtonText = "Upload File",
}: FileUploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || uploading || status === "success") return;
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (disabled || uploading || status === "success") return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleContainerClick = () => {
    if (disabled || uploading || status === "success") return;
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleContainerClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
    // Reset input value so selecting the same file again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  const handleReplace = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUpload) {
      onUpload();
    }
  };

  if (status === "success") {
    return (
      <div className={cn("border-2 border-dashed border-green-500 bg-green-50/50 rounded-lg p-6 flex flex-col items-center justify-center space-y-3", className)}>
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{file?.name}</p>
          <p className="text-xs text-green-600 mt-1">Successfully uploaded.</p>
        </div>
      </div>
    );
  }

  if (status === "error" || errorMsg) {
    return (
      <div 
        className={cn("border-2 border-dashed border-red-300 bg-red-50/50 rounded-lg p-6 flex flex-col items-center justify-center space-y-4 cursor-pointer hover:border-red-400 transition-colors", className)}
        onClick={handleContainerClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
      >
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Upload failed.</p>
          <p className="text-xs text-red-600 mt-1">{errorMsg || "Please try again."}</p>
        </div>
        <div className="flex gap-2 mt-2">
           <Button variant="outline" size="sm" onClick={handleReplace}>
             Try Again
           </Button>
           <Button variant="ghost" size="sm" onClick={handleRemove}>
             Cancel
           </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || uploading}
          tabIndex={-1}
        />
      </div>
    );
  }

  if (uploading || ["intent", "finalizing"].includes(status)) {
    return (
      <div className={cn("border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg p-8 flex flex-col items-center justify-center space-y-4", className)}>
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium">Uploading...</p>
          <p className="text-xs text-muted-foreground mt-1">Please wait while your file is being processed.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleContainerClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40",
        file ? "bg-muted/30" : "bg-card",
        disabled && "opacity-60 cursor-not-allowed hover:border-border",
        !disabled && "cursor-pointer",
        className
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        tabIndex={-1}
      />

      {!file ? (
        <>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4 pointer-events-none">
            <UploadCloud className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-center pointer-events-none space-y-1">
            <p className="text-sm font-medium text-foreground">{title}</p>
            {helperText && (
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{helperText}</p>
            )}
          </div>
        </>
      ) : (
        <div className="w-full flex flex-col items-center space-y-4">
          <div className="flex flex-col items-center text-center space-y-1 pointer-events-none">
            <File className="w-8 h-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground line-clamp-1 break-all px-4">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(file.size)} selected.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 w-full mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReplace}
              disabled={disabled}
            >
              Replace File
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={disabled}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              Remove
            </Button>
          </div>

          {onUpload && (
            <Button
              size="default"
              onClick={handleUploadClick}
              disabled={disabled}
              className="w-full mt-4"
            >
              {uploadButtonText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
