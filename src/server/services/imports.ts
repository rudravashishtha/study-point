import { db } from "../../lib/db";
import { Prisma, ImportType, ImportJobStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import { ServiceResult, success, failure } from "./types";
import { createAdminClient } from "../../lib/supabase/admin";
import { ActorContext } from "../../lib/domain/actor";
import {
  validateStudentHeaders,
  validateStudentRows,
  confirmStudentImport,
} from "./import-students";
import {
  validateQuestionHeaders,
  validateQuestionRows,
  confirmQuestionImport,
} from "./import-questions";

const IMPORT_SOURCES_BUCKET = "import-sources";
const MAX_IMPORT_ROWS = 5000;
const EXPIRATION_DAYS = 30;

interface ValidationProblem {
  column: string;
  problem: string;
  expectedValue: string;
}

export interface ImportSummary {
  importJobId: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  importedRows: number;
  failedRows: number;
  skippedRows: number;
  status: ImportJobStatus;
}

interface ErrorRowResult {
  rowNumber: number;
  data: Record<string, string>;
  problems: ValidationProblem[];
}

export interface ImportErrorReport {
  importJobId: string;
  filename: string;
  errors: ErrorRowResult[];
}

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot).toLowerCase();
}

function validateFileType(filename: string): ServiceResult<void> {
  const ext = getExtension(filename);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return failure(
      "IMPORT_VALIDATION",
      `Unsupported file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }
  return success(undefined);
}

function parseSpreadsheet(
  buffer: Buffer,
): ServiceResult<{ headers: string[]; rows: Record<string, string>[] }> {
  try {
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      raw: true,
      cellFormula: false,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return failure("IMPORT_VALIDATION", "Workbook contains no sheets");
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    if (!worksheet || !worksheet["!ref"]) {
      return failure("IMPORT_VALIDATION", "The first sheet is empty");
    }

    const data: string[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    if (!data || data.length === 0) {
      return failure("IMPORT_VALIDATION", "The sheet contains no data");
    }

    const headers = (data[0] as string[]).map((h: string) =>
      typeof h === "string" ? h.trim() : "",
    );
    const rawRows = data
      .slice(1)
      .filter(
        (row: string[]) =>
          Array.isArray(row) &&
          row.some((cell: string) => typeof cell === "string" && cell.trim() !== ""),
      );

    if (rawRows.length === 0) {
      return failure(
        "IMPORT_VALIDATION",
        "The sheet contains only headers, no data rows",
      );
    }

    const rows = rawRows.map((row: string[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        const val = row[i];
        obj[header] = val !== undefined && val !== null ? String(val).trim() : "";
      });
      return obj;
    });

    return success({ headers, rows });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error during parsing";
    return failure("IMPORT_VALIDATION", `Failed to parse spreadsheet: ${message}`);
  }
}

function getStoragePath(jobId: string, originalFilename: string): string {
  return `import-sources/${jobId}/${originalFilename}`;
}

// ─── Type dispatch helpers ──────────────────────────────────────

async function dispatchValidation(
  importType: ImportType,
  headers: string[],
): Promise<ServiceResult<{ normalizedHeaders: string[] }>> {
  if (importType === "QUESTION") {
    return validateQuestionHeaders(headers);
  }
  return validateStudentHeaders(headers);
}

async function dispatchRowValidation(
  importType: ImportType,
  rows: Record<string, string>[],
  headers: string[],
): Promise<{
  parsedRows: Array<{
    data: Record<string, string>;
    status: "VALID" | "WARNING" | "ERROR";
    errors: ValidationProblem[];
    warnings: ValidationProblem[];
  }>;
}> {
  if (importType === "QUESTION") {
    return validateQuestionRows(rows, headers);
  }
  return validateStudentRows(rows, headers);
}

async function dispatchConfirm(
  importType: ImportType,
  validRowList: { id: string; rowNumber: number; data: unknown }[],
  jobId: string,
  actor: ActorContext,
): Promise<{ importedCount: number; failedCount: number }> {
  if (importType === "QUESTION") {
    return confirmQuestionImport(validRowList, jobId, actor);
  }
  return confirmStudentImport(validRowList, jobId, actor);
}

// ─── Exported Service Functions ────────────────────────────────────

export async function createImportJob(
  input: {
    importType: ImportType;
    originalFilename: string;
    fileSize: number;
  },
  actorUserId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const job = await db.importJob.create({
      data: {
        importType: input.importType,
        originalFilename: input.originalFilename,
        fileSize: input.fileSize,
        status: "PENDING",
        createdBy: actorUserId,
      },
    });
    return success({ id: job.id });
  } catch (error) {
    console.error("createImportJob error:", error);
    return failure("INTERNAL_ERROR", "Failed to create import job");
  }
}

export async function uploadImportFile(
  jobId: string,
  file: { buffer: Buffer; originalFilename: string; mimeType: string },
  actorUserId: string,
): Promise<ServiceResult<void>> {
  try {
    const job = await db.importJob.findUnique({ where: { id: jobId } });
    if (!job) return failure("NOT_FOUND", "Import job not found");
    if (job.status !== "PENDING") {
      return failure("INVALID_LIFECYCLE", "Import job is not in PENDING state");
    }

    const extCheck = validateFileType(file.originalFilename);
    if (!extCheck.success) return extCheck;

    const storagePath = getStoragePath(jobId, file.originalFilename);
    const supabase = createAdminClient();

    const { error: uploadError } = await supabase.storage
      .from(IMPORT_SOURCES_BUCKET)
      .upload(storagePath, file.buffer, {
        contentType: file.mimeType || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      return failure("IMPORT_FAILED", `Storage upload failed: ${uploadError.message}`);
    }

    await db.$transaction(async (tx) => {
      await tx.importJob.update({
        where: { id: jobId },
        data: { sourceStoragePath: storagePath },
      });
      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "IMPORT_FILE_UPLOAD",
          entityType: "IMPORT_JOB",
          entityId: jobId,
          summary: `Uploaded file ${file.originalFilename} for import`,
          metadata: { originalFilename: file.originalFilename, storagePath },
        },
      });
    });

    return success(undefined);
  } catch (error) {
    console.error("uploadImportFile error:", error);
    return failure("INTERNAL_ERROR", "Failed to upload import file");
  }
}

export async function validateImport(
  jobId: string,
  _actorUserId: string,
): Promise<ServiceResult<ImportSummary>> {
  try {
    const job = await db.importJob.findUnique({ where: { id: jobId } });
    if (!job) return failure("NOT_FOUND", "Import job not found");
    if (job.status !== "PENDING" && job.status !== "READY") {
      return failure(
        "INVALID_LIFECYCLE",
        "Import job must be in PENDING or READY state to validate",
      );
    }

    if (!job.sourceStoragePath) {
      return failure("INVALID_LIFECYCLE", "Import job has no source file uploaded");
    }

    const importType = job.importType;

    const supabase = createAdminClient();
    const storagePath = job.sourceStoragePath.replace(`${IMPORT_SOURCES_BUCKET}/`, "");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from(IMPORT_SOURCES_BUCKET)
      .download(storagePath);

    if (downloadError || !fileData) {
      return failure(
        "IMPORT_FAILED",
        `Failed to download source file: ${downloadError?.message || "Unknown error"}`,
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());

    const parseResult = parseSpreadsheet(buffer);
    if (!parseResult.success) {
      await db.importJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorSummary: parseResult.error.message,
        },
      });
      return parseResult;
    }

    const { headers, rows } = parseResult.data;

    if (rows.length > MAX_IMPORT_ROWS) {
      await db.importJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorSummary: `Row limit exceeded: ${rows.length} rows (max ${MAX_IMPORT_ROWS})`,
        },
      });
      return failure(
        "IMPORT_VALIDATION",
        `Row limit exceeded: ${rows.length} rows (max ${MAX_IMPORT_ROWS})`,
      );
    }

    const headerResult = await dispatchValidation(importType, headers);
    if (!headerResult.success) {
      await db.importJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorSummary: headerResult.error.message,
        },
      });
      return headerResult;
    }

    const { parsedRows } = await dispatchRowValidation(importType, rows, headers);

    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const importRowsData: Prisma.ImportRowCreateManyInput[] = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const pr = parsedRows[i];
      if (pr.status === "VALID") validCount++;
      else if (pr.status === "WARNING") warningCount++;
      else errorCount++;

      const rowData: Prisma.ImportRowCreateManyInput = {
        rowNumber: i + 1,
        importJobId: jobId,
        status: pr.status,
        data: pr.data as unknown as Prisma.InputJsonValue,
      };

      if (pr.errors.length > 0) {
        rowData.errors = pr.errors as unknown as Prisma.InputJsonValue;
      }
      if (pr.warnings.length > 0) {
        rowData.warnings = pr.warnings as unknown as Prisma.InputJsonValue;
      }

      importRowsData.push(rowData);
    }

    const totalRows = importRowsData.length;
    const finalStatus: ImportJobStatus = validCount > 0 ? "READY" : "FAILED";

    await db.$transaction(async (tx) => {
      await tx.importRow.deleteMany({ where: { importJobId: jobId } });

      if (importRowsData.length > 0) {
        await tx.importRow.createMany({ data: importRowsData });
      }

      await tx.importJob.update({
        where: { id: jobId },
        data: {
          status: finalStatus,
          totalRows,
          validRows: validCount,
          warningRows: warningCount,
          errorRows: errorCount,
          importedRows: 0,
          failedRows: 0,
          skippedRows: 0,
          errorSummary: finalStatus === "FAILED" ? "No valid rows found" : null,
        },
      });
    });

    return success({
      importJobId: jobId,
      totalRows,
      validRows: validCount,
      warningRows: warningCount,
      errorRows: errorCount,
      importedRows: 0,
      failedRows: 0,
      skippedRows: 0,
      status: finalStatus,
    });
  } catch (error) {
    console.error("validateImport error:", error);
    return failure("INTERNAL_ERROR", "Failed to validate import");
  }
}

export async function confirmImport(
  jobId: string,
  actor: ActorContext,
): Promise<ServiceResult<ImportSummary>> {
  try {
    const job = await db.importJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        importType: true,
        status: true,
        totalRows: true,
        validRows: true,
        warningRows: true,
        errorRows: true,
        rows: {
          where: { status: "VALID" },
          select: { id: true, rowNumber: true, data: true },
        },
      },
    });

    if (!job) return failure("NOT_FOUND", "Import job not found");
    if (job.status !== "READY") {
      return failure(
        "INVALID_LIFECYCLE",
        `Import job must be in READY state, current: ${job.status}`,
      );
    }

    const validRowList = job.rows;
    if (validRowList.length === 0) {
      return failure("IMPORT_VALIDATION", "No valid rows to import");
    }

    const importType = job.importType;

    await db.importJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    const { importedCount, failedCount } = await dispatchConfirm(
      importType,
      validRowList,
      jobId,
      actor,
    );

    const summaryMessage = `Imported ${importedCount} record(s)${failedCount > 0 ? `, ${failedCount} failed` : ""}`;

    const finalStatus: ImportJobStatus =
      failedCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";

    await db.importJob.update({
      where: { id: jobId },
      data: {
        status: finalStatus,
        importedRows: importedCount,
        failedRows: failedCount,
        completedAt: new Date(),
        errorSummary: summaryMessage,
      },
    });

    return success({
      importJobId: jobId,
      totalRows: job.totalRows,
      validRows: job.validRows,
      warningRows: job.warningRows,
      errorRows: job.errorRows,
      importedRows: importedCount,
      failedRows: failedCount,
      skippedRows: 0,
      status: finalStatus,
    });
  } catch (error) {
    await db.importJob
      .update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorSummary:
            error instanceof Error ? error.message : "Unknown error during confirm",
          completedAt: new Date(),
        },
      })
      .catch(() => {});

    console.error("confirmImport error:", error);
    return failure("IMPORT_FAILED", "Failed to confirm import");
  }
}

export async function listImportJobs(
  input: {
    page?: number;
    pageSize?: number;
    importType?: ImportType;
  },
  _actorUserId: string,
): Promise<
  ServiceResult<{
    items: Array<{
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
    }>;
    total: number;
    page: number;
    pageSize: number;
  }>
> {
  try {
    const page = Math.max(1, input.page || 1);
    const pageSize = Math.min(100, Math.max(1, input.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Prisma.ImportJobWhereInput = {};
    if (input.importType) {
      where.importType = input.importType;
    }

    const [items, total] = await Promise.all([
      db.importJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        select: {
          id: true,
          importType: true,
          originalFilename: true,
          status: true,
          totalRows: true,
          validRows: true,
          importedRows: true,
          failedRows: true,
          createdAt: true,
          completedAt: true,
          createdBy: true,
        },
      }),
      db.importJob.count({ where }),
    ]);

    return success({ items, total, page, pageSize });
  } catch (error) {
    console.error("listImportJobs error:", error);
    return failure("INTERNAL_ERROR", "Failed to list import jobs");
  }
}

export async function getImportJob(
  jobId: string,
  _actorUserId: string,
): Promise<
  ServiceResult<{
    id: string;
    importType: ImportType;
    originalFilename: string;
    fileSize: number;
    sourceStoragePath: string | null;
    status: ImportJobStatus;
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    importedRows: number;
    failedRows: number;
    skippedRows: number;
    errorSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    createdBy: string | null;
  }>
> {
  try {
    const job = await db.importJob.findUnique({ where: { id: jobId } });
    if (!job) return failure("NOT_FOUND", "Import job not found");
    return success(job);
  } catch (error) {
    console.error("getImportJob error:", error);
    return failure("INTERNAL_ERROR", "Failed to get import job");
  }
}

export async function getImportErrors(
  jobId: string,
  _actorUserId: string,
): Promise<ServiceResult<ImportErrorReport>> {
  try {
    const job = await db.importJob.findUnique({
      where: { id: jobId },
      select: { originalFilename: true },
    });
    if (!job) return failure("NOT_FOUND", "Import job not found");

    const errorRows = await db.importRow.findMany({
      where: { importJobId: jobId, status: "ERROR" },
      orderBy: { rowNumber: "asc" },
      select: { rowNumber: true, data: true, errors: true },
    });

    const errors: ErrorRowResult[] = errorRows.map((row) => ({
      rowNumber: row.rowNumber,
      data: row.data as unknown as Record<string, string>,
      problems: (row.errors as unknown as ValidationProblem[]) || [],
    }));

    return success({
      importJobId: jobId,
      filename: job.originalFilename,
      errors,
    });
  } catch (error) {
    console.error("getImportErrors error:", error);
    return failure("INTERNAL_ERROR", "Failed to get import errors");
  }
}

export async function deleteExpiredImports(): Promise<
  ServiceResult<{ deleted: number }>
> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - EXPIRATION_DAYS);

    const expiredJobs = await db.importJob.findMany({
      where: {
        completedAt: { not: null, lte: cutoff },
        sourceStoragePath: { not: null },
      },
      select: { id: true, sourceStoragePath: true },
    });

    if (expiredJobs.length === 0) return success({ deleted: 0 });

    const supabase = createAdminClient();

    for (const job of expiredJobs) {
      if (job.sourceStoragePath) {
        const storagePath = job.sourceStoragePath.replace(
          `${IMPORT_SOURCES_BUCKET}/`,
          "",
        );
        await supabase.storage
          .from(IMPORT_SOURCES_BUCKET)
          .remove([storagePath])
          .catch(() => {});
      }
    }

    const expiredIds = expiredJobs.map((j) => j.id);

    await db.importJob.updateMany({
      where: { id: { in: expiredIds } },
      data: { sourceStoragePath: null },
    });

    return success({ deleted: expiredJobs.length });
  } catch (error) {
    console.error("deleteExpiredImports error:", error);
    return failure("INTERNAL_ERROR", "Failed to delete expired imports");
  }
}

export { generateStudentTemplate } from "./import-students";
export { generateQuestionTemplate } from "./import-questions";
