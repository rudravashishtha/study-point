import { describe, it, expect, beforeEach, afterAll, beforeAll, vi } from "vitest";
import {
  createEnrolment,
  updateEnrolment,
  archiveEnrolment,
  restoreEnrolment,
} from "./enrolments";
import { createBatch } from "./batches";
import { db as prisma } from "../../lib/db";
import {
  isTestConfigured,
  setupIsolatedTestDb,
  initializeTestDb,
} from "../../lib/test/db-isolation";
import { PrismaClient } from "@prisma/client";

vi.mock("../../lib/db", () => ({
  get db() {
    return (globalThis as any).__testDb;
  },
}));

const testDb = setupIsolatedTestDb();

describe.skipIf(!isTestConfigured)("Enrolment Service Integration", () => {
  let db: PrismaClient;
  let sessionId: string;
  let trackId: string;
  let batchId: string;
  let student1Id: string;
  let student2Id: string;

  beforeAll(async () => {
    await initializeTestDb();
    db = testDb as PrismaClient;

    let session = await db.academicSession.findFirst({ where: { isActive: true } });
    if (!session) {
      session = await db.academicSession.create({
        data: {
          name: "Test Session Enrolment",
          startsOn: new Date(),
          endsOn: new Date(),
          isActive: true,
        },
      });
    }
    sessionId = session.id;

    let board = await db.board.findFirst({ where: { code: "TBE" } });
    if (!board)
      board = await db.board.create({
        data: { name: "Test Board Enrolment", code: "TBE" },
      });

    let subject = await db.subject.findFirst({ where: { code: "TSE" } });
    if (!subject)
      subject = await db.subject.create({
        data: { name: "Test Subject Enrolment", code: "TSE" },
      });

    let track = await db.curriculumTrack.findFirst({
      where: { boardId: board.id, subjectId: subject.id, classLevel: "X" },
    });
    if (!track) {
      track = await db.curriculumTrack.create({
        data: {
          boardId: board.id,
          subjectId: subject.id,
          classLevel: "X",
          displayName: "Test Track Enrolment",
        },
      });
    }
    trackId = track.id;

    const teacher = await db.teacher.create({
      data: { displayName: "Test Teacher Enrolment", active: true },
    });

    const batchResult = await createBatch({
      name: "Enrolment Batch",
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      capacity: 1, // Only 1 capacity to test limits
      isActive: true,
      schedules: [],
    });

    if (!batchResult.success) throw new Error("Failed to create test batch");
    batchId = batchResult.data.id;

    const student1 = await db.student.create({
      data: { fullName: "Test Student 1", studentCode: "S1" },
    });
    const student2 = await db.student.create({
      data: { fullName: "Test Student 2", studentCode: "S2" },
    });
    student1Id = student1.id;
    student2Id = student2.id;
  }, 30000);

  afterAll(async () => {
    if (!isTestConfigured) return;
    await db.enrolment.deleteMany({});
    await db.batchSchedule.deleteMany({});
    await db.teacherAssignment.deleteMany({});
    await db.homework.deleteMany({});
    await db.batch.deleteMany({});
    if (student1Id && student2Id) {
      await db.student.deleteMany({ where: { id: { in: [student1Id, student2Id] } } });
    }
    await db.curriculumTrack.deleteMany({ where: { id: trackId } });
  });

  beforeEach(async () => {
    await db.enrolment.deleteMany({});
    await db.auditLog.deleteMany({ where: { entityType: "ENROLMENT" } });
  });

  it("creates an enrolment without a batch", async () => {
    const result = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      joiningDate: new Date(),
    });
    expect(result.success).toBe(true);
    if (!result.success) return;

    if (!result.success) throw new Error("FAIL");
    expect(result.data.studentId).toBe(student1Id);
    expect(result.data.batchId).toBe(null);
    expect(result.data.status).toBe("active");
  });

  it("enforces unique enrolment per student+session+track", async () => {
    const first = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      joiningDate: new Date(),
    });
    expect(first.success).toBe(true);

    const second = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      joiningDate: new Date(),
    });
    expect(second.success).toBe(false);
    if (!second.success) {
      if (second.success) throw new Error("FAIL");
      expect(second.error.code).toBe("DUPLICATE_IDENTITY");
    }
  });

  it("enforces capacity when assigned to a batch", async () => {
    const first = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    if (!first.success) throw new Error("FAIL");

    const second = await createEnrolment({
      studentId: student2Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    expect(second.success).toBe(false);
    if (!second.success) {
      expect(second.error.code).toBe("CAPACITY_EXCEEDED");
    }
  });

  it("does not consume capacity if withdrawn", async () => {
    const first = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      status: "withdrawn",
      joiningDate: new Date(),
    });
    if (!first.success) throw new Error("FAIL");

    const second = await createEnrolment({
      studentId: student2Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      status: "active",
      joiningDate: new Date(),
    });
    expect(second.success).toBe(true);

    // Now try to update the first enrolment to 'active' which should fail due to capacity
    const updateFail = await updateEnrolment(first.data.id, { status: "active" });
    expect(updateFail.success).toBe(false);
    if (!updateFail.success) {
      expect(updateFail.error.code).toBe("CAPACITY_EXCEEDED");
    }
  });

  it("frees capacity when archived", async () => {
    const first = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    if (!first.success) throw new Error("FAIL");

    const archive = await archiveEnrolment(first.data.id);
    expect(archive.success).toBe(true);

    const second = await createEnrolment({
      studentId: student2Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    expect(second.success).toBe(true);
  });

  it("prevents restore if it would exceed capacity", async () => {
    const first = await createEnrolment({
      studentId: student1Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    if (!first.success) throw new Error("FAIL");

    await archiveEnrolment(first.data.id);

    const second = await createEnrolment({
      studentId: student2Id,
      academicSessionId: sessionId,
      curriculumTrackId: trackId,
      batchId: batchId,
      joiningDate: new Date(),
    });
    expect(second.success).toBe(true);

    const restore = await restoreEnrolment(first.data.id);
    expect(restore.success).toBe(false);
    if (!restore.success) {
      expect(restore.error.code).toBe("CAPACITY_EXCEEDED");
    }
  });
});
