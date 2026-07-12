import { FileAsset, FileUploadScope, FileUploadUsageCategory } from "@prisma/client";
import { z } from "zod";
import { db as prisma } from "../../lib/db";
import { ServiceResult, success, failure } from "./types";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Ensure we have a singleton admin client for server-side storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

const BUCKET_NAME = "academic-content";

export const uploadIntentSchema = z.object({
  originalFilename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024), // 50MB
  usageCategory: z.nativeEnum(FileUploadUsageCategory),
  uploadScope: z.nativeEnum(FileUploadScope),
  targetBatchId: z.string().uuid().optional().nullable(),
  targetSessionId: z.string().uuid().optional().nullable(),
  targetTrackId: z.string().uuid().optional().nullable(),
});

export type UploadIntentInput = z.infer<typeof uploadIntentSchema>;

export type UploadIntentResult = {
  fileAssetId: string;
  uploadUrl: string;
};

export async function createUploadIntent(
  actorUserId: string,
  input: UploadIntentInput,
): Promise<ServiceResult<UploadIntentResult>> {
  const parsed = uploadIntentSchema.safeParse(input);
  if (!parsed.success) {
    return failure("INVALID_INPUT", "Invalid upload intent input");
  }
  const data = parsed.data;

  // Exact XOR Validation
  if (data.uploadScope === "BATCH") {
    if (!data.targetBatchId || data.targetSessionId || data.targetTrackId) {
      return failure("INVALID_SCOPE", "BATCH scope requires exactly targetBatchId");
    }
  } else if (data.uploadScope === "CURRICULUM_TRACK") {
    if (data.targetBatchId || !data.targetSessionId || !data.targetTrackId) {
      return failure(
        "INVALID_SCOPE",
        "CURRICULUM_TRACK scope requires exactly targetSessionId and targetTrackId",
      );
    }
  }

  // Generate storage key
  const storageKey = `${data.uploadScope.toLowerCase()}/${randomUUID()}-${data.originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

  const asset = await prisma.$transaction(async (tx) => {
    const newAsset = await tx.fileAsset.create({
      data: {
        bucket: BUCKET_NAME,
        storageKey,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageAccessClass: "PRIVATE",
        lifecycleState: "PENDING",
        usageCategory: data.usageCategory,
        uploadScope: data.uploadScope,
        targetBatchId: data.targetBatchId,
        targetSessionId: data.targetSessionId,
        targetTrackId: data.targetTrackId,
        uploadedById: actorUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "FILE_UPLOAD_INTENT",
        entityType: "FileAsset",
        entityId: newAsset.id,
        actorUserId: actorUserId,
        summary: "Upload intent created",
        metadata: {
          storageKey,
          sizeBytes: data.sizeBytes,
          originalFilename: data.originalFilename,
        },
      },
    });

    return newAsset;
  });

  // Generate Supabase signed upload URL
  const { data: signedData, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(storageKey);

  if (error || !signedData) {
    return failure("UPLOAD_URL_FAILED", "Failed to generate upload URL");
  }

  return success({
    fileAssetId: asset.id,
    uploadUrl: signedData.signedUrl,
  });
}

export async function finalizeUpload(
  actorUserId: string,
  fileAssetId: string,
): Promise<ServiceResult<FileAsset>> {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: fileAssetId },
  });

  if (!asset) {
    return failure("NOT_FOUND", "FileAsset not found");
  }

  if (asset.lifecycleState === "ACTIVE") {
    return success(asset); // Idempotent
  }

  if (asset.lifecycleState === "ARCHIVED" || asset.lifecycleState === "ABANDONED") {
    return failure("INVALID_STATE", "Asset is " + asset.lifecycleState);
  }

  if (asset.lifecycleState !== "PENDING") {
    return failure("INVALID_STATE", "FileAsset is not in PENDING state");
  }

  // Only the uploader or an admin should finalize.
  // We assume caller has authorized this if they passed actorUserId, but we enforce uploader match or admin check higher up.
  // For safety, require uploadedById match here if not admin (caller responsibility or checked here).
  // Actually, we'll just check it here:
  const user = await prisma.appUser.findUnique({ where: { id: actorUserId } });
  if (!user) return failure("UNAUTHORIZED", "User not found");
  if (user.role !== "ADMIN" && asset.uploadedById !== actorUserId) {
    return failure("UNAUTHORIZED", "Cannot finalize another user's upload");
  }

  // Verify object exists in storage and matches size (roughly)
  // Unfortunately createSignedUrl is the easiest way to check if it exists without listing
  // But wait, there's no `info` method. We can use list.
  const pathParts = asset.storageKey.split("/");
  const prefix = pathParts.slice(0, -1).join("/");
  const filename = pathParts[pathParts.length - 1];

  const { data: listData, error: listError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(prefix, { search: filename });

  if (listError) {
    return failure("STORAGE_ERROR", "Failed to query storage");
  }

  const foundFile = listData.find((f) => f.name === filename);
  if (!foundFile) {
    return failure("FILE_MISSING", "File not found in storage");
  }

  if (foundFile.metadata?.size !== asset.sizeBytes) {
    return failure(
      "SIZE_MISMATCH",
      "Uploaded file size does not match expected sizeBytes",
    );
  }

  if (foundFile.metadata?.mimetype && foundFile.metadata.mimetype !== asset.mimeType) {
    return failure(
      "MIME_MISMATCH",
      "Uploaded file MIME type does not match expected MIME type",
    );
  }

  const updatedAsset = await prisma.$transaction(async (tx) => {
    const updated = await tx.fileAsset.update({
      where: { id: fileAssetId },
      data: { lifecycleState: "ACTIVE" },
    });

    await tx.auditLog.create({
      data: {
        action: "FILE_UPLOAD_FINALIZED",
        entityType: "FileAsset",
        entityId: updated.id,
        actorUserId: actorUserId,
        summary: "Upload finalized",
        metadata: { sizeBytes: foundFile.metadata?.size || asset.sizeBytes },
      },
    });

    return updated;
  });

  return success(updatedAsset);
}

export async function abandonUpload(
  actorUserId: string,
  fileAssetId: string,
): Promise<ServiceResult<FileAsset>> {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: fileAssetId },
  });

  if (!asset) return failure("NOT_FOUND", "Asset not found");
  if (asset.lifecycleState === "ACTIVE" || asset.lifecycleState === "ARCHIVED") {
    return failure("INVALID_STATE", "Cannot abandon ACTIVE or ARCHIVED asset");
  }

  // Support retrying abandoned cleanup
  if (asset.lifecycleState === "ABANDONED" && asset.storageDeletedAt !== null) {
    return success(asset);
  }

  let updatedAsset = await prisma.$transaction(async (tx) => {
    const updated = await tx.fileAsset.update({
      where: { id: fileAssetId },
      data: { lifecycleState: "ABANDONED", storageDeletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        action: "FILE_UPLOAD_ABANDONED",
        entityType: "FileAsset",
        entityId: updated.id,
        actorUserId: actorUserId,
        summary: "Upload abandoned",
        metadata: {},
      },
    });

    return updated;
  });

  // Attempt to delete from storage as cleanup
  const { error: removeError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .remove([asset.storageKey]);

  // If the file is missing or removed successfully, we mark it as deleted.
  // Supabase returns the list of successfully deleted objects. If our object is not in the list, it wasn't deleted (or didn't exist).
  // But if it didn't exist, we still consider cleanup complete.
  // Wait, if it didn't exist, removeData will be empty, removeError will be null.
  // If removeError is present, it's a real failure.
  if (!removeError) {
    updatedAsset = await prisma.fileAsset.update({
      where: { id: fileAssetId },
      data: { storageDeletedAt: new Date() },
    });
  }

  return success(updatedAsset);
}

export async function getDownloadUrl(
  fileAssetId: string,
): Promise<ServiceResult<string>> {
  const asset = await prisma.fileAsset.findUnique({
    where: { id: fileAssetId },
  });
  if (!asset || asset.lifecycleState !== "ACTIVE") {
    return failure("NOT_FOUND", "Active FileAsset not found");
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(asset.storageKey, 60, {
      download: asset.originalFilename,
    });

  if (error || !data) {
    return failure("DOWNLOAD_FAILED", "Failed to generate signed URL");
  }

  return success(data.signedUrl);
}
