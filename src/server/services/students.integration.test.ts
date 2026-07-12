import { describe, it, expect, beforeAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(_target, prop) {
        const db = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
        if (!db) throw new Error("testDb is not initialized");
        return (db as unknown as Record<string, unknown>)[prop as string];
      },
    }),
  };
});

vi.mock("../../lib/db", () => ({
  db: testDbProxy,
}));

import { isTestConfigured, initializeTestDb } from "../../lib/test/db-isolation";
import { createStudent, archiveStudent } from "./students";

// use testDbProxy as prisma in tests
const prisma = testDbProxy;
describe.skipIf(!isTestConfigured)("Students Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();

    // Clear out sequences and students to ensure a clean slate
    await prisma.enrolment.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.systemSequence.deleteMany({});
  });

  it("safely generates concurrent student codes with distinct monotonically increasing values", async () => {
    const year = 2026;
    const sequenceId = `STUDENT_CODE_${year}`;

    // Insert initial sequence if we want, or let it upsert.
    // Let's capture the start if it exists (it shouldn't).
    const startSeq = await prisma.systemSequence.findUnique({
      where: { id: sequenceId },
    });
    const initialValue = startSeq?.lastValue || 0;

    const concurrencyCount = 10;

    // Launch concurrent creations
    const promises = Array.from({ length: concurrencyCount }).map((_, i) =>
      createStudent({ fullName: `Concurrent Student ${i}` }, undefined, year),
    );

    const results = await Promise.all(promises);

    // Ensure all succeeded
    expect(results.every((r) => r.success)).toBe(true);

    // Extract codes
    const codes = results.map((r) => (r.success ? r.data.studentCode : ""));
    const uniqueCodes = new Set(codes);

    // Verify distinct codes
    expect(uniqueCodes.size).toBe(concurrencyCount);

    // Verify sequence delta
    const endSeq = await prisma.systemSequence.findUnique({ where: { id: sequenceId } });
    expect(endSeq).not.toBeNull();

    const delta = endSeq!.lastValue - initialValue;
    expect(delta).toBe(concurrencyCount);

    // Verify formatting (e.g. STU-2026-0001)
    for (const code of codes) {
      expect(code).toMatch(/^STU-2026-\d{4,}$/);
    }
  });

  it("partitions sequence generation by year", async () => {
    const year2027 = 2027;

    const res1 = await createStudent({ fullName: "Year 27 First" }, undefined, year2027);
    const res2 = await createStudent({ fullName: "Year 27 Second" }, undefined, year2027);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    if (res1.success && res2.success) {
      expect(res1.data.studentCode).toBe("STU-2027-0001");
      expect(res2.data.studentCode).toBe("STU-2027-0002");
    }

    // 2026 should remain unaffected (currently at 10)
    const seq2026 = await prisma.systemSequence.findUnique({
      where: { id: "STUDENT_CODE_2026" },
    });
    expect(seq2026?.lastValue).toBe(10);
  });

  it("blocks archiving a student with unarchived enrolments", async () => {
    const res = await createStudent({ fullName: "Active Enrolment Test" });
    expect(res.success).toBe(true);
    if (!res.success) return;

    const studentId = res.data.id;

    // Create prerequisites for an enrolment
    const unique = Date.now().toString() + Math.random().toString();
    const session = await prisma.academicSession.create({
      data: {
        name: `Test Session ${unique}`,
        startsOn: new Date(),
        endsOn: new Date(),
        isActive: false,
      },
    });

    const board = await prisma.board.create({
      data: { name: `Board X ${unique}`, code: `BX${unique}` },
    });
    const subject = await prisma.subject.create({
      data: { name: `Math ${unique}`, code: `M1${unique}` },
    });
    const track = await prisma.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: `Track ${unique}`,
      },
    });

    const enrolment = await prisma.enrolment.create({
      data: {
        studentId,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        joiningDate: new Date(),
        status: "active",
      },
    });

    // Attempt to archive student
    const archiveRes = await archiveStudent(studentId);
    expect(archiveRes.success).toBe(false);
    if (!archiveRes.success) {
      expect(archiveRes.error.code).toBe("ARCHIVE_BLOCKED");
    }

    // Now administratively archive the enrolment
    await prisma.enrolment.update({
      where: { id: enrolment.id },
      data: { archivedAt: new Date() },
    });

    // Attempt to archive student again (should succeed)
    const archiveRes2 = await archiveStudent(studentId);
    expect(archiveRes2.success).toBe(true);
  });
  it("rolls back sequence increment if student creation fails", async () => {
    const year = 2028;
    const sequenceId = `STUDENT_CODE_${year}`;

    // Seed the sequence to 0
    await prisma.systemSequence.upsert({
      where: { id: sequenceId },
      create: { id: sequenceId, lastValue: 0 },
      update: { lastValue: 0 },
    });

    // Manually insert a blocking student code to force a collision
    await prisma.student.create({
      data: {
        studentCode: "STU-2028-0001",
        fullName: "Blocker",
        accountStatus: "none",
      },
    });

    // Attempt creation. The sequence will increment to 1, then the insert will P2002
    const res = await createStudent({ fullName: "Victim" }, undefined, year);

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe("DUPLICATE_IDENTITY");
    }

    // Prove sequence rolled back
    const seq = await prisma.systemSequence.findUnique({ where: { id: sequenceId } });
    expect(seq?.lastValue).toBe(0);

    // Prove Victim was not created
    const victim = await prisma.student.findFirst({ where: { fullName: "Victim" } });
    expect(victim).toBeNull();
  });
});
