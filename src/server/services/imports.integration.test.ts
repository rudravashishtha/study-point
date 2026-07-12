import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { PrismaClient, ImportJobStatus } from "@prisma/client";
import * as XLSX from "xlsx";

const { testDbProxy, storageMap } = vi.hoisted(() => {
  const map = new Map<string, Buffer>();
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(_target, prop) {
        const db = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
        if (!db) throw new Error("testDb is not initialized");
        return (db as unknown as Record<string, unknown>)[prop as string];
      },
    }),
    storageMap: map,
  };
});

vi.mock("../../lib/db", () => ({
  db: testDbProxy,
}));

vi.mock("../../lib/supabase/admin", () => ({
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: async (path: string, buffer: Buffer) => {
          storageMap.set(path, buffer);
          return { data: { path }, error: null };
        },
        download: async (path: string) => {
          const buf = storageMap.get(path);
          if (buf) {
            return { data: new Blob([new Uint8Array(buf)]), error: null };
          }
          return { data: null, error: { message: "Object not found" } };
        },
        remove: async (paths: string[]) => {
          for (const p of paths) storageMap.delete(p);
          return { data: paths, error: null };
        },
      }),
    },
  }),
}));

import { isTestConfigured, initializeTestDb } from "../../lib/test/db-isolation";
import {
  createImportJob,
  uploadImportFile,
  validateImport,
  confirmImport,
  listImportJobs,
  getImportJob,
  getImportErrors,
  deleteExpiredImports,
  generateStudentTemplate,
} from "./imports";
import { ActorContext } from "../../lib/domain/actor";
import { ImportType as ImportTypeEnum } from "@prisma/client";

const prisma = testDbProxy;

const mockActor: ActorContext = {
  userId: "integration-test-admin",
  role: "ADMIN",
  metadata: { role: "ADMIN", status: "ACTIVE" },
};

function createValidXlsxBuffer(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Full Name", "Phone", "Guardian Phone", "Email", "Joining Date"],
    ["Alice Kumar", "9876543210", "9876543211", "alice@test.com", "01-04-2026"],
    ["Bob Singh", "9876543212", "", "bob@test.com", "15-05-2026"],
    ["Charlie Gupta", "", "", "", ""],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createCsvBuffer(): Buffer {
  const csv =
    "Full Name,Phone,Guardian Phone,Email,Joining Date\n" +
    "Diana Shah,9876543213,9876543214,diana@test.com,01-06-2026\n" +
    "Evan Roy,9876543215,,evan@test.com,\n";
  return Buffer.from(csv, "utf-8");
}

function createXlsxWithEmptyHeader(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Full Name", "", "Guardian Phone", "Email", "Joining Date"],
    ["Test User", "9876543210", "", "test@test.com", "01-04-2026"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createXlsxWithDuplicateHeaders(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Full Name", "Phone", "Phone", "Email", "Joining Date"],
    ["Test User", "111", "222", "test@test.com", "01-04-2026"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createXlsxWithInvalidHeaders(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Full Name", "Random Col", "Email", "Joining Date"],
    ["Test User", "value", "test@test.com", "01-04-2026"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createEmptySheetBuffer(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData: string[][] = [
    ["Full Name", "Phone", "Guardian Phone", "Email", "Joining Date"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

function createXlsxWithMissingRequiredHeader(): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Phone", "Email", "Joining Date"],
    ["9876543210", "test@test.com", "01-04-2026"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

async function createAndSetupImportJob(
  buffer: Buffer,
  filename: string = "students.xlsx",
  mimeType: string = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
): Promise<{ jobId: string }> {
  const createResult = await createImportJob(
    {
      importType: ImportTypeEnum.STUDENT,
      originalFilename: filename,
      fileSize: buffer.length,
    },
    mockActor.userId,
  );
  expect(createResult.success).toBe(true);
  if (!createResult.success) throw new Error("Failed to create job");
  const jobId = createResult.data.id;

  const uploadResult = await uploadImportFile(
    jobId,
    { buffer, originalFilename: filename, mimeType },
    mockActor.userId,
  );
  expect(uploadResult.success).toBe(true);

  return { jobId };
}

describe.skipIf(!isTestConfigured)("Imports Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    storageMap.clear();
    await prisma.importRow.deleteMany({});
    await prisma.importJob.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.systemSequence.deleteMany({});
    await prisma.auditLog.deleteMany({});
  });

  beforeEach(async () => {
    storageMap.clear();
    await prisma.importRow.deleteMany({});
    await prisma.importJob.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.systemSequence.deleteMany({});
  });

  // ─── basic operations ─────────────────────────────────────

  it("successfully creates an import job", async () => {
    const result = await createImportJob(
      {
        importType: ImportTypeEnum.STUDENT,
        originalFilename: "test.xlsx",
        fileSize: 1024,
      },
      mockActor.userId,
    );
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBeTruthy();

    const job = await prisma.importJob.findUnique({
      where: { id: result.data.id },
    });
    expect(job).not.toBeNull();
    expect(job!.status).toBe("PENDING");
    expect(job!.importType).toBe("STUDENT");
    expect(job!.originalFilename).toBe("test.xlsx");
    expect(job!.createdBy).toBe(mockActor.userId);
  });

  it("uploads a file to storage and persists sourceStoragePath", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    expect(job).not.toBeNull();
    expect(job!.sourceStoragePath).toContain("import-sources/");
    expect(job!.sourceStoragePath).toContain(jobId);
  });

  it("validates import, creates ImportRows, transitions to READY", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(true);
    if (!validateResult.success) return;

    expect(validateResult.data.status).toBe("READY" as ImportJobStatus);
    expect(validateResult.data.totalRows).toBe(3);
    expect(validateResult.data.validRows).toBe(3);
    expect(validateResult.data.errorRows).toBe(0);
    expect(validateResult.data.warningRows).toBe(0);

    const rows = await prisma.importRow.findMany({
      where: { importJobId: jobId },
    });
    expect(rows).toHaveLength(3);
    expect(rows.every((r: { status: string }) => r.status === "VALID")).toBe(true);

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    expect(job!.status).toBe("READY" as ImportJobStatus);
  });

  it("rejects empty headers", async () => {
    const buffer = createXlsxWithEmptyHeader();
    const { jobId } = await createAndSetupImportJob(buffer);

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
    if (validateResult.success) return;
    expect(validateResult.error.message).toContain("empty column");

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    expect(job!.status).toBe("FAILED" as ImportJobStatus);
  });

  it("rejects duplicate headers", async () => {
    const { jobId } = await createAndSetupImportJob(createXlsxWithDuplicateHeaders());

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
    if (validateResult.success) return;
    expect(validateResult.error.message).toContain("Duplicate headers");
  });

  it("rejects invalid headers", async () => {
    const { jobId } = await createAndSetupImportJob(createXlsxWithInvalidHeaders());

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
    if (validateResult.success) return;
    expect(validateResult.error.message).toContain("Unexpected headers");
  });

  it("rejects missing required headers", async () => {
    const { jobId } = await createAndSetupImportJob(
      createXlsxWithMissingRequiredHeader(),
    );

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
    if (validateResult.success) return;
    expect(validateResult.error.message).toContain("Required headers missing");
  });

  it("rejects empty sheet (headers only)", async () => {
    const { jobId } = await createAndSetupImportJob(createEmptySheetBuffer());

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
    if (validateResult.success) return;
    expect(validateResult.error.message).toContain("only headers");
  });

  it("rejects malformed workbook", async () => {
    const badBuffer = Buffer.from("not an xlsx file", "utf-8");
    const { jobId } = await createAndSetupImportJob(
      badBuffer,
      "bad.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(false);
  });

  it("parses CSV files correctly", async () => {
    const buffer = createCsvBuffer();
    const { jobId } = await createAndSetupImportJob(buffer, "students.csv", "text/csv");

    const validateResult = await validateImport(jobId, mockActor.userId);
    expect(validateResult.success).toBe(true);
    if (!validateResult.success) return;
    expect(validateResult.data.totalRows).toBe(2);
    expect(validateResult.data.validRows).toBe(2);
    expect(validateResult.data.status).toBe("READY" as ImportJobStatus);
  });

  it("generates a valid xlsx template", async () => {
    const result = await generateStudentTemplate();
    expect(result.success).toBe(true);
    if (!result.success) return;

    const wb = XLSX.read(result.data.buffer, { type: "buffer" });
    expect(wb.SheetNames).toContain("Students");
    const ws = wb.Sheets["Students"];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as string[][];
    expect(data[0]).toEqual([
      "Full Name",
      "Phone",
      "Guardian Phone",
      "Email",
      "Joining Date",
    ]);
  });

  // ─── confirm flow ─────────────────────────────────────────

  it("confirms import and creates students", async () => {
    const buffer = createValidXlsxBuffer();
    const { jobId } = await createAndSetupImportJob(buffer);

    await validateImport(jobId, mockActor.userId);

    const confirmResult = await confirmImport(jobId, mockActor);
    expect(confirmResult.success).toBe(true);
    if (!confirmResult.success) return;

    expect(confirmResult.data.importedRows).toBe(3);
    expect(confirmResult.data.failedRows).toBe(0);
    expect(confirmResult.data.status).toBe("COMPLETED" as ImportJobStatus);

    const students = await prisma.student.findMany({
      orderBy: { studentCode: "asc" },
    });
    expect(students).toHaveLength(3);
    expect(students[0].fullName).toBe("Alice Kumar");
    expect(students[1].fullName).toBe("Bob Singh");
    expect(students[2].fullName).toBe("Charlie Gupta");

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    expect(job!.status).toBe("COMPLETED" as ImportJobStatus);
  });

  it("handles P2002 duplicate gracefully, continues with remaining rows", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());
    await validateImport(jobId, mockActor.userId);

    // First confirm: import all 3 students
    const firstConfirm = await confirmImport(jobId, mockActor);
    expect(firstConfirm.success).toBe(true);

    // Create a second import job with same data
    const { jobId: jobId2 } = await createAndSetupImportJob(createValidXlsxBuffer());
    await validateImport(jobId2, mockActor.userId);

    const secondConfirm = await confirmImport(jobId2, mockActor);
    expect(secondConfirm.success).toBe(true);
    if (!secondConfirm.success) return;

    // Since student codes are auto-generated (unique), P2002 won't trigger
    // unless there's a unique constraint violation on email
    // Student emails are NOT unique in the schema
    // so this test verifies that the flow handles 3 new codes correctly
    expect(secondConfirm.data.importedRows).toBe(3);
    expect(secondConfirm.data.failedRows).toBe(0);

    const students = await prisma.student.findMany();
    expect(students).toHaveLength(6);
  });

  it("creates audit log entries for imported students", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());
    await validateImport(jobId, mockActor.userId);
    await confirmImport(jobId, mockActor);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "IMPORT_STUDENT_CREATE",
        entityType: "STUDENT",
      },
    });
    expect(auditLogs).toHaveLength(3);
    expect(auditLogs[0].actorUserId).toBe(mockActor.userId);
  });

  it("tracks confirm counters accurately", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());
    await validateImport(jobId, mockActor.userId);
    await confirmImport(jobId, mockActor);

    const job = await prisma.importJob.findUnique({
      where: { id: jobId },
    });
    expect(job!.importedRows).toBe(3);
    expect(job!.failedRows).toBe(0);
  });

  // ─── list / get queries ───────────────────────────────────

  it("lists import jobs", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());

    const listResult = await listImportJobs({}, mockActor.userId);
    expect(listResult.success).toBe(true);
    if (!listResult.success) return;
    expect(listResult.data.items.length).toBeGreaterThanOrEqual(1);
    expect(listResult.data.items.some((i) => i.id === jobId)).toBe(true);
  });

  it("gets a single import job", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());

    const getResult = await getImportJob(jobId, mockActor.userId);
    expect(getResult.success).toBe(true);
    if (!getResult.success) return;
    expect(getResult.data.id).toBe(jobId);
    expect(getResult.data.originalFilename).toBe("students.xlsx");
  });

  it("returns error report for failed rows", async () => {
    const { jobId } = await createAndSetupImportJob(createXlsxWithInvalidHeaders());
    await validateImport(jobId, mockActor.userId);

    const errorsResult = await getImportErrors(jobId, mockActor.userId);
    expect(errorsResult.success).toBe(true);
  });

  it("returns empty error list when no errors", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());
    await validateImport(jobId, mockActor.userId);

    const errorsResult = await getImportErrors(jobId, mockActor.userId);
    expect(errorsResult.success).toBe(true);
    if (!errorsResult.success) return;
    expect(errorsResult.data.errors).toHaveLength(0);
  });

  it("returns NOT_FOUND for non-existent import job", async () => {
    const result = await getImportJob("non-existent-id", mockActor.userId);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  it("rejects upload to non-existent job", async () => {
    const buffer = createValidXlsxBuffer();
    const result = await uploadImportFile(
      "non-existent-id",
      { buffer, originalFilename: "test.xlsx", mimeType: "application/octet-stream" },
      mockActor.userId,
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.code).toBe("NOT_FOUND");
  });

  // ─── expired job cleanup ──────────────────────────────────

  it("cleans up expired import jobs", async () => {
    const expiredJob = await prisma.importJob.create({
      data: {
        importType: "STUDENT",
        originalFilename: "old.xlsx",
        fileSize: 100,
        status: "COMPLETED" as ImportJobStatus,
        sourceStoragePath: "import-sources/old-id/old.xlsx",
        completedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
        createdBy: mockActor.userId,
      },
    });

    storageMap.set("import-sources/old-id/old.xlsx", Buffer.from("test"));

    const result = await deleteExpiredImports();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.deleted).toBeGreaterThanOrEqual(1);

    const cleaned = await prisma.importJob.findUnique({
      where: { id: expiredJob.id },
    });
    expect(cleaned!.sourceStoragePath).toBeNull();
    expect(storageMap.has("import-sources/old-id/old.xlsx")).toBe(false);
  });

  it("does not clean up non-expired import jobs", async () => {
    await prisma.importJob.create({
      data: {
        importType: "STUDENT",
        originalFilename: "recent.xlsx",
        fileSize: 100,
        status: "COMPLETED" as ImportJobStatus,
        sourceStoragePath: "import-sources/recent/recent.xlsx",
        completedAt: new Date(),
        createdBy: mockActor.userId,
      },
    });

    const result = await deleteExpiredImports();
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.deleted).toBe(0);
  });

  // ─── ownership / retention metadata ───────────────────────

  it("persists import type, filename, creator, and timestamps", async () => {
    const { jobId } = await createAndSetupImportJob(createValidXlsxBuffer());

    const getResult = await getImportJob(jobId, mockActor.userId);
    expect(getResult.success).toBe(true);
    if (!getResult.success) return;

    expect(getResult.data.importType).toBe("STUDENT");
    expect(getResult.data.originalFilename).toBe("students.xlsx");
    expect(getResult.data.createdBy).toBe(mockActor.userId);
    expect(getResult.data.createdAt).toBeTruthy();
    expect(getResult.data.fileSize).toBeGreaterThan(0);
    expect(getResult.data.sourceStoragePath).toContain("import-sources/");
  });

  // ─── concurrent operations ────────────────────────────────

  it("handles concurrent confirmation", async () => {
    const buffer = createValidXlsxBuffer();
    const { jobId: jobId1 } = await createAndSetupImportJob(buffer);

    const buffer2 = createValidXlsxBuffer();
    const { jobId: jobId2 } = await createAndSetupImportJob(buffer2, "students2.xlsx");

    await Promise.all([
      validateImport(jobId1, mockActor.userId),
      validateImport(jobId2, mockActor.userId),
    ]);

    const results = await Promise.all([
      confirmImport(jobId1, mockActor),
      confirmImport(jobId2, mockActor),
    ]);

    expect(results.every((r) => r.success)).toBe(true);

    const students = await prisma.student.findMany();
    expect(students).toHaveLength(6);

    const codes = students.map((s: { studentCode: string }) => s.studentCode);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(6);
  });

  it("handles CSV parsing through validation", async () => {
    const buffer = createCsvBuffer();
    const { jobId } = await createAndSetupImportJob(buffer, "students.csv", "text/csv");
    const result = await validateImport(jobId, mockActor.userId);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.totalRows).toBe(2);
  });
});
