import { db } from "../../lib/db";
import { Prisma, ImportType, ImportJobStatus } from "@prisma/client";
import { z } from "zod";
import * as XLSX from "xlsx";
import { ServiceResult, success, failure } from "./types";
import { createAdminClient } from "../../lib/supabase/admin";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";

const IMPORT_SOURCES_BUCKET = "import-sources";
const MAX_IMPORT_ROWS = 5000;
const EXPIRATION_DAYS = 30;

const EXPECTED_HEADERS = [
  "full name",
  "phone",
  "guardian phone",
  "email",
  "joining date",
] as const;

const studentImportRowSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable().default(null),
  guardianPhone: z.string().max(20).optional().nullable().default(null),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable()
    .or(z.literal(""))
    .default(null),
  joiningDate: z.string().optional().nullable().default(null),
});
type StudentImportRow = z.infer<typeof studentImportRowSchema>;

interface ValidationProblem {
  column: string;
  problem: string;
  expectedValue: string;
}

interface ParsedRow {
  data: Record<string, string>;
  status: "VALID" | "WARNING" | "ERROR";
  errors: ValidationProblem[];
  warnings: ValidationProblem[];
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

function detectDuplicateHeaders(headers: string[]): string[] {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const h of headers) {
    const lower = h.toLowerCase().trim();
    if (seen.has(lower)) {
      duplicates.push(h);
    }
    seen.add(lower);
  }
  return duplicates;
}

function validateHeaders(
  headers: string[],
): ServiceResult<{ normalizedHeaders: string[] }> {
  const trimmed = headers.map((h) => h.trim());

  if (trimmed.some((h) => h === "")) {
    return failure("IMPORT_VALIDATION", "Header row contains empty column names");
  }

  const duplicates = detectDuplicateHeaders(trimmed);
  if (duplicates.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Duplicate headers found: ${duplicates.join(", ")}`,
    );
  }

  const lowerHeaders = trimmed.map((h) => h.toLowerCase());
  const expected = EXPECTED_HEADERS.map((h) => h.toLowerCase());

  const invalidHeaders = lowerHeaders.filter((h) => !expected.includes(h));
  if (invalidHeaders.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Unexpected headers: ${invalidHeaders.join(", ")}. Expected: ${EXPECTED_HEADERS.join(", ")}`,
    );
  }

  const missingHeaders = expected.filter((e) => !lowerHeaders.includes(e));
  const requiredMissing = missingHeaders.filter((h) => h === "full name");
  if (requiredMissing.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Required headers missing: ${requiredMissing
        .map((h) => EXPECTED_HEADERS.find((e) => e.toLowerCase() === h) || h)
        .join(", ")}`,
    );
  }

  return success({ normalizedHeaders: EXPECTED_HEADERS as unknown as string[] });
}

function buildHeaderMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  EXPECTED_HEADERS.forEach((expected) => {
    const lower = expected.toLowerCase();
    const found = headers.find((h) => h.toLowerCase().trim() === lower);
    if (found) {
      mapping[expected] = found;
    }
  });
  return mapping;
}

function mapFields(
  row: Record<string, string>,
  headerMapping: Record<string, string>,
): StudentImportRow {
  const fullNameKey =
    Object.keys(headerMapping).find(
      (k) => k.toLowerCase() === "full name" && headerMapping[k],
    ) || "full name";
  const phoneKey =
    Object.keys(headerMapping).find(
      (k) => k.toLowerCase() === "phone" && headerMapping[k],
    ) || "phone";
  const guardianKey =
    Object.keys(headerMapping).find(
      (k) => k.toLowerCase() === "guardian phone" && headerMapping[k],
    ) || "guardian phone";
  const emailKey =
    Object.keys(headerMapping).find(
      (k) => k.toLowerCase() === "email" && headerMapping[k],
    ) || "email";
  const dateKey =
    Object.keys(headerMapping).find(
      (k) => k.toLowerCase() === "joining date" && headerMapping[k],
    ) || "joining date";

  return {
    fullName: row[headerMapping[fullNameKey] || fullNameKey] || "",
    phone: row[headerMapping[phoneKey] || phoneKey] || null,
    guardianPhone: row[headerMapping[guardianKey] || guardianKey] || null,
    email: row[headerMapping[emailKey] || emailKey] || null,
    joiningDate: row[headerMapping[dateKey] || dateKey] || null,
  };
}

function parseDateString(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === "") return null;

  const trimmed = dateStr.trim();

  const ddMmYyyy = /^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/;
  const yyyyMmDd = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/;

  let day: number;
  let month: number;
  let year: number;

  const ddMatch = trimmed.match(ddMmYyyy);
  if (ddMatch) {
    day = parseInt(ddMatch[1], 10);
    month = parseInt(ddMatch[2], 10);
    year = parseInt(ddMatch[3], 10);
  } else {
    const yyyyMatch = trimmed.match(yyyyMmDd);
    if (yyyyMatch) {
      year = parseInt(yyyyMatch[1], 10);
      month = parseInt(yyyyMatch[2], 10);
      day = parseInt(yyyyMatch[3], 10);
    } else {
      return null;
    }
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;

  return date.toISOString();
}

function getExpectedValue(column: string): string {
  const expectations: Record<string, string> = {
    fullName: "A name between 1-100 characters",
    phone: "A phone number (max 20 characters)",
    guardianPhone: "A phone number (max 20 characters)",
    email: "A valid email address or leave empty",
    joiningDate: "DD-MM-YYYY or YYYY-MM-DD",
  };
  return expectations[column] || "Valid value";
}

function validateRow(
  row: Record<string, string>,
  headerMapping: Record<string, string>,
): ParsedRow {
  const problems: ValidationProblem[] = [];
  const warnings: ValidationProblem[] = [];
  const mapped = mapFields(row, headerMapping);

  const parsed = studentImportRowSchema.safeParse(mapped);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      problems.push({
        column: issue.path.join(".") || "Unknown",
        problem: issue.message,
        expectedValue: getExpectedValue(issue.path.join(".")),
      });
    }
  }

  if (mapped.joiningDate && mapped.joiningDate.trim() !== "") {
    const parsedDate = parseDateString(mapped.joiningDate);
    if (!parsedDate) {
      problems.push({
        column: "Joining Date",
        problem: "Invalid date format",
        expectedValue: "DD-MM-YYYY or YYYY-MM-DD",
      });
    }
  }

  if (mapped.phone && mapped.phone.trim() !== "") {
    const phoneClean = mapped.phone.replace(/[\s\-\(\)]/g, "");
    if (phoneClean.length < 10) {
      warnings.push({
        column: "Phone",
        problem: "Phone number seems too short",
        expectedValue: "At least 10 digits",
      });
    }
  }

  if (mapped.guardianPhone && mapped.guardianPhone.trim() !== "") {
    const phoneClean = mapped.guardianPhone.replace(/[\s\-\(\)]/g, "");
    if (phoneClean.length < 10) {
      warnings.push({
        column: "Guardian Phone",
        problem: "Guardian phone number seems too short",
        expectedValue: "At least 10 digits",
      });
    }
  }

  if (problems.length > 0) {
    return { data: row, status: "ERROR", errors: problems, warnings };
  }

  if (warnings.length > 0) {
    return { data: row, status: "WARNING", errors: [], warnings };
  }

  return { data: row, status: "VALID", errors: [], warnings: [] };
}

async function generateStudentCode(
  tx: Omit<
    Prisma.TransactionClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
  year: number,
): Promise<string> {
  const sequenceId = `STUDENT_CODE_${year}`;
  const seq = await tx.systemSequence.upsert({
    where: { id: sequenceId },
    create: { id: sequenceId, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  const padded = seq.lastValue.toString().padStart(4, "0");
  return `STU-${year}-${padded}`;
}

function getStoragePath(jobId: string, originalFilename: string): string {
  return `import-sources/${jobId}/${originalFilename}`;
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

    const headerResult = validateHeaders(headers);
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

    const headerMapping = buildHeaderMapping(headers);
    const parsedRows: ParsedRow[] = rows.map((row) => validateRow(row, headerMapping));

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

    const currentYear = new Date().getFullYear();

    await db.importJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    let importedCount = 0;
    let failedCount = 0;
    const failedDetails: string[] = [];

    await db.$transaction(async (tx) => {
      for (const row of validRowList) {
        try {
          const rawData = row.data as Record<string, string>;
          const headers = Object.keys(rawData).filter((k) => k !== "_studentCode");
          const headerMapping = buildHeaderMapping(headers);
          const mapped = mapFields(rawData, headerMapping);

          const studentCode = await generateStudentCode(tx, currentYear);

          const parsedDate = parseDateString(mapped.joiningDate);

          await tx.student.create({
            data: {
              studentCode,
              fullName: mapped.fullName,
              phone: mapped.phone || null,
              guardianPhone: mapped.guardianPhone || null,
              email: mapped.email || null,
              joiningDate: parsedDate ? new Date(parsedDate) : null,
              accountStatus: "none",
            },
          });

          await createAuditLog(tx, actor, {
            action: "IMPORT_STUDENT_CREATE",
            entityType: "STUDENT",
            entityId: studentCode,
            summary: `Created student ${studentCode} via bulk import`,
            metadata: {
              importJobId: jobId,
              fullName: mapped.fullName,
              importRowId: row.id,
            },
          });

          importedCount++;

          await tx.importRow.update({
            where: { id: row.id },
            data: {
              data: {
                ...(rawData as Record<string, unknown>),
                _studentCode: studentCode,
              } as Prisma.InputJsonValue,
            },
          });
        } catch (error: unknown) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            failedCount++;
            failedDetails.push(
              `Row ${row.rowNumber}: Duplicate entry (student code or email conflict)`,
            );
          } else {
            throw error;
          }
        }
      }
    });

    const summaryMessage =
      failedDetails.length > 0
        ? `Imported ${importedCount} student(s), ${failedCount} failed`
        : `Imported ${importedCount} student(s)`;

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

export async function generateStudentTemplate(): Promise<
  ServiceResult<{ buffer: Buffer; filename: string }>
> {
  try {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ["Full Name", "Phone", "Guardian Phone", "Email", "Joining Date"],
      [
        "Example Student",
        "9876543210",
        "9876543211",
        "student@example.com",
        "01-04-2026",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];

    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const arrayBuf = XLSX.write(wb, {
      type: "array",
      bookType: "xlsx",
    });

    return success({
      buffer: Buffer.from(arrayBuf),
      filename: "student-import-template.xlsx",
    });
  } catch (error) {
    console.error("generateStudentTemplate error:", error);
    return failure("INTERNAL_ERROR", "Failed to generate template");
  }
}
