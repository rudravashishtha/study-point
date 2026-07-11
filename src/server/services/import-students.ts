import { db } from "../../lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import * as XLSX from "xlsx";
import { ServiceResult, success, failure } from "./types";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";

export const STUDENT_EXPECTED_HEADERS = [
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

function buildHeaderMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  STUDENT_EXPECTED_HEADERS.forEach((expected) => {
    const lower = expected.toLowerCase();
    const found = headers.find((h) => h.toLowerCase().trim() === lower);
    if (found) {
      mapping[expected] = found;
    }
  });
  return mapping;
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

export function validateStudentHeaders(
  headers: string[],
): ServiceResult<{ normalizedHeaders: string[] }> {
  const trimmed = headers.map((h) => h.trim());

  if (trimmed.some((h) => h === "")) {
    return failure("IMPORT_VALIDATION", "Header row contains empty column names");
  }

  const lowerHeaders = trimmed.map((h) => h.toLowerCase());
  const expected = STUDENT_EXPECTED_HEADERS.map((h) => h.toLowerCase());

  const invalidHeaders = lowerHeaders.filter((h) => !expected.includes(h));
  if (invalidHeaders.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Unexpected headers: ${invalidHeaders.join(", ")}. Expected: ${STUDENT_EXPECTED_HEADERS.join(", ")}`,
    );
  }

  const missingRequired = expected
    .filter((e) => e === "full name")
    .filter((e) => !lowerHeaders.includes(e));
  if (missingRequired.length > 0) {
    return failure(
      "IMPORT_VALIDATION",
      `Required headers missing: ${missingRequired.join(", ")}`,
    );
  }

  return success({ normalizedHeaders: STUDENT_EXPECTED_HEADERS as unknown as string[] });
}

export function validateStudentRows(
  rows: Record<string, string>[],
  headers: string[],
): {
  parsedRows: ParsedRow[];
} {
  const headerMapping = buildHeaderMapping(headers);
  const parsedRows = rows.map((row) => validateRow(row, headerMapping));
  return { parsedRows };
}

export async function confirmStudentImport(
  validRowList: { id: string; rowNumber: number; data: unknown }[],
  jobId: string,
  actor: ActorContext,
): Promise<{
  importedCount: number;
  failedCount: number;
}> {
  const currentYear = new Date().getFullYear();

  let importedCount = 0;
  let failedCount = 0;

  await db.$transaction(async (tx) => {
    for (const row of validRowList) {
      try {
        const rawData = row.data as Record<string, string>;
        const headers = Object.keys(rawData).filter((k) => k !== "_studentCode");
        const headerMapping = buildHeaderMapping(headers);
        const mapped = mapFields(rawData, headerMapping);

        const sequenceId = `STUDENT_CODE_${currentYear}`;
        const seq = await tx.systemSequence.upsert({
          where: { id: sequenceId },
          create: { id: sequenceId, lastValue: 1 },
          update: { lastValue: { increment: 1 } },
        });
        const padded = seq.lastValue.toString().padStart(4, "0");
        const studentCode = `STU-${currentYear}-${padded}`;

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
        } else {
          throw error;
        }
      }
    }
  });

  return { importedCount, failedCount };
}

export function generateStudentTemplate(): ServiceResult<{
  buffer: Buffer;
  filename: string;
}> {
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

    const arrayBuf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    return success({
      buffer: Buffer.from(arrayBuf),
      filename: "student-import-template.xlsx",
    });
  } catch (error) {
    console.error("generateStudentTemplate error:", error);
    return failure("INTERNAL_ERROR", "Failed to generate template");
  }
}
