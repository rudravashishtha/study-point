import { describe, it, expect, beforeEach, afterAll, beforeAll, vi } from "vitest";
import { createBatch, updateBatch, archiveBatch, restoreBatch } from "./batches";
import {
  isTestConfigured,
  setupIsolatedTestDb,
  initializeTestDb,
} from "../../lib/test/db-isolation";
import { PrismaClient } from "@prisma/client";

vi.mock("../../lib/db", () => ({
  get db() {
    return (globalThis as Record<string, unknown>).__testDb;
  },
}));

const testDb = setupIsolatedTestDb();

describe.skipIf(!isTestConfigured)("Batches Service Integration", () => {
  let db: PrismaClient;

  let boardId: string;
  let subjectId: string;
  let trackId: string;
  let sessionId: string;
  let teacherId: string;

  beforeAll(async () => {
    await initializeTestDb();
    db = testDb as PrismaClient;
    let session = await db.academicSession.findFirst({ where: { isActive: true } });
    if (!session) {
      session = await db.academicSession.create({
        data: {
          name: "Test Session Batch",
          startsOn: new Date(),
          endsOn: new Date(),
          isActive: true,
        },
      });
    }
    sessionId = session.id;

    const board = await db.board.create({
      data: { name: "Test Board Batch", code: "TB" },
    });
    boardId = board.id;

    const subject = await db.subject.create({
      data: { name: "Test Subject Batch", code: "TS" },
    });
    subjectId = subject.id;

    const track = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "Test Track Batch",
      },
    });
    trackId = track.id;

    const teacher = await db.teacher.create({
      data: { displayName: "Test Teacher Batch", active: true },
    });
    teacherId = teacher.id;
  });

  afterAll(async () => {
    if (!isTestConfigured) return;
    await db.enrolment.deleteMany({});
    await db.batchSchedule.deleteMany({});
    await db.homework.deleteMany({});
    await db.test.deleteMany({});
    await db.batch.deleteMany({});
    await db.curriculumTrack.deleteMany({ where: { id: trackId } });
    await db.subject.deleteMany({ where: { id: subjectId } });
    await db.board.deleteMany({ where: { id: boardId } });
    await db.teacher.deleteMany({ where: { id: teacherId } });
    await db.academicSession.deleteMany({ where: { id: sessionId } });
  });

  beforeEach(async () => {
    await db.enrolment.deleteMany({});
    await db.batchSchedule.deleteMany({});
    await db.teacherAssignment.deleteMany({});
    await db.homework.deleteMany({});
    await db.test.deleteMany({});
    await db.batch.deleteMany({});
    await db.auditLog.deleteMany({ where: { entityType: "BATCH" } });
  });

  describe("createBatch", () => {
    it("creates a batch successfully", async () => {
      const result = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Morning Batch",
        capacity: 30,
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", isActive: true },
        ],
      });

      if (!result.success) {
        console.error(result.error);
      }
      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.name).toBe("Morning Batch");
      const schedules = await db.batchSchedule.findMany({
        where: { batchId: result.data.id },
      });
      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.startTime).toBe("09:00");

      const audits = await db.auditLog.findMany({ where: { entityId: result.data.id } });
      expect(audits).toHaveLength(1);
      expect(audits[0]?.action).toBe("CREATE");
    });

    it("prevents overlapping schedules", async () => {
      const result = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Conflict Batch",
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:30", isActive: true },
          { dayOfWeek: 1, startTime: "10:00", endTime: "11:00", isActive: true },
        ],
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toMatch(/Overlapping schedules/);
      }
    });

    it("allows perfectly adjacent schedules", async () => {
      const result = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Adjacent Batch",
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", isActive: true },
          { dayOfWeek: 1, startTime: "10:00", endTime: "11:00", isActive: true },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("updateBatch", () => {
    it("updates basic fields and bulk replaces schedules", async () => {
      const batch = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Update Target",
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", isActive: true },
        ],
      });
      if (!batch.success) {
        console.error(batch.error);
        throw new Error("Setup failed");
      }

      const updated = await updateBatch(batch.data.id, {
        name: "Renamed Target",
        capacity: 30,
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        schedules: [
          { dayOfWeek: 2, startTime: "11:00", endTime: "12:00", isActive: true },
          { dayOfWeek: 3, startTime: "11:00", endTime: "12:00", isActive: true },
        ],
      });

      expect(updated.success).toBe(true);
      if (!updated.success) return;

      expect(updated.data.name).toBe("Renamed Target");
      const schedules = await db.batchSchedule.findMany({
        where: { batchId: updated.data.id },
      });
      expect(schedules).toHaveLength(2);

      const audits = await db.auditLog.findMany({
        where: { entityId: batch.data.id, action: "UPDATE" },
      });
      expect(audits).toHaveLength(1);
    });

    it("preserves schedules when schedules field is omitted", async () => {
      const batch = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Omit Schedules Target",
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", isActive: true },
        ],
      });
      if (!batch.success) throw new Error("Setup failed");

      // Update without sending `schedules`
      const updated = await updateBatch(batch.data.id, {
        name: "Omit Schedules Target Renamed",
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
      });

      expect(updated.success).toBe(true);
      if (!updated.success) return;

      expect(updated.data.name).toBe("Omit Schedules Target Renamed");
      const schedules = await db.batchSchedule.findMany({
        where: { batchId: updated.data.id },
      });
      // Should still be exactly 1
      expect(schedules).toHaveLength(1);
      expect(schedules[0]?.startTime).toBe("09:00");
    });

    it("removes all schedules when schedules field is an explicit empty array", async () => {
      const batch = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Empty Schedules Target",
        schedules: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "10:00", isActive: true },
        ],
      });
      if (!batch.success) throw new Error("Setup failed");

      // Update with explicit empty array
      const updated = await updateBatch(batch.data.id, {
        name: "Empty Schedules Target",
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        schedules: [],
      });

      expect(updated.success).toBe(true);
      if (!updated.success) return;

      const schedules = await db.batchSchedule.findMany({
        where: { batchId: updated.data.id },
      });
      // Should be cleared
      expect(schedules).toHaveLength(0);
    });
  });

  describe("archiveBatch", () => {
    it("archives successfully and prevents updates", async () => {
      const batch = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Archive Target",
      });
      if (!batch.success) throw new Error("Setup failed");

      const archived = await archiveBatch(batch.data.id);
      expect(archived.success).toBe(true);

      const updated = await updateBatch(batch.data.id, {
        name: "Fail",
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
      });
      expect(updated.success).toBe(false);
      if (!updated.success) {
        expect(updated.error.code).toBe("INVALID_LIFECYCLE");
      }
    });
  });

  describe("restoreBatch", () => {
    it("restores successfully unless there is a name collision", async () => {
      const batch = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Collision Target",
      });
      if (!batch.success) throw new Error("Setup failed");

      await archiveBatch(batch.data.id);

      // Create another active one with the same name
      const collision = await createBatch({
        academicSessionId: sessionId,
        curriculumTrackId: trackId,
        name: "Collision Target",
      });
      expect(collision.success).toBe(true);

      if (!batch.success) throw new Error("Expected success");
      const restoreFail = await restoreBatch(batch.data.id);
      expect(restoreFail.success).toBe(false);
      if (!restoreFail.success) {
        expect(restoreFail.error.code).toBe("DUPLICATE_IDENTITY");
      }

      const getBatch = await db.batch.findUnique({ where: { id: batch.data.id } });
      if (!getBatch) throw new Error("Expected success");
      expect(getBatch.archivedAt).not.toBeNull();

      if (!collision.success) throw new Error("FAIL");
      await archiveBatch(collision.data.id);
      const restoreSuccess = await restoreBatch(batch.data.id);
      expect(restoreSuccess.success).toBe(true);
    });
  });
});
