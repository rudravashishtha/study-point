import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, Role } from "@prisma/client";

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

vi.mock("@/lib/db", () => ({
  db: testDbProxy,
}));

import {
  initializeTestDb,
  teardownTestDb,
  isTestConfigured,
} from "@/lib/test/db-isolation";
import {
  createLiveClassSession,
  updateLiveClassSession,
  cancelLiveClassSession,
  getLiveClassSessionsForAdmin,
  getLiveClassSessionsForTeacher,
  getLiveClassSessionsForStudent,
} from "./live-classes";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("Live Class Session Service Integration", () => {
  beforeAll(async () => {
    await initializeTestDb();
    // Clean up any leftover data from previous runs to avoid unique constraint collisions
    const db = testDbProxy as PrismaClient;
    await db.liveClassSession.deleteMany();
    await db.enrolment.deleteMany();
    await db.teacherAssignment.deleteMany();
    await db.batch.deleteMany();
    await db.curriculumTrack.deleteMany();
    await db.subject.deleteMany();
    await db.board.deleteMany();
    await db.academicSession.deleteMany();
    await db.appUser.deleteMany();
    await db.teacher.deleteMany();
    await db.student.deleteMany();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("proves the live class authorization and invariant matrix", async () => {
    const db = prisma;

    // ── Setup ──────────────────────────────────────────────
    const adminUser = await db.appUser.create({
      data: { role: Role.ADMIN, status: "ACTIVE" },
    });

    const session = await db.academicSession.create({
      data: { name: "LC Test Session", isActive: true },
    });

    const board = await db.board.create({ data: { code: "LCBOARD", name: "LC Board" } });
    const subject = await db.subject.create({
      data: { code: "LCMATH", name: "LC Math" },
    });
    const track = await db.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "X",
        displayName: "LC Track",
      },
    });

    const batchA = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "LC Batch A",
        isActive: true,
      },
    });

    const archivedBatch = await db.batch.create({
      data: {
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        name: "LC Archived Batch",
        isActive: true,
        archivedAt: new Date(),
      },
    });

    // Teacher setup
    const teacher1User = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacher1Entity = await db.teacher.create({
      data: { displayName: "LC Teacher 1" },
    });
    await db.appUser.update({
      where: { id: teacher1User.id },
      data: { teacherId: teacher1Entity.id },
    });

    const teacher2User = await db.appUser.create({
      data: { role: Role.TEACHER, status: "ACTIVE" },
    });
    const teacher2Entity = await db.teacher.create({
      data: { displayName: "LC Teacher 2" },
    });
    await db.appUser.update({
      where: { id: teacher2User.id },
      data: { teacherId: teacher2Entity.id },
    });

    // Assignments
    await db.teacherAssignment.create({
      data: {
        teacherId: teacher1Entity.id,
        batchId: batchA.id,
        permissions: ["SCHEDULE_MANAGE", "SCHEDULE_VIEW"],
      },
    });

    // Student setup
    const studentUser = await db.appUser.create({
      data: { role: Role.STUDENT, status: "ACTIVE" },
    });
    const studentEntity = await db.student.create({
      data: { studentCode: "LCSTU01", fullName: "LC Student" },
    });
    await db.appUser.update({
      where: { id: studentUser.id },
      data: { studentId: studentEntity.id },
    });

    await db.enrolment.create({
      data: {
        studentId: studentEntity.id,
        academicSessionId: session.id,
        curriculumTrackId: track.id,
        batchId: batchA.id,
        joiningDate: new Date(),
        status: "active",
      },
    });

    const now = new Date();
    const startTime = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
    const endTime = new Date(now.getTime() + 1000 * 60 * 120); // 2 hours from now

    // ════════════════════════════════════════════════════════
    // Test 1: Admin creates live class for Batch A
    // ════════════════════════════════════════════════════════
    // Using teacher1Entity as the assigned teacher for the class
    const createResult = await createLiveClassSession(
      {
        batchId: batchA.id,
        teacherId: teacher1Entity.id,
        title: "Admin Created Class",
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: "SCHEDULED",
        meetingUrl: "https://meet.google.com/abc-defg-hij",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );

    expect(createResult.success).toBe(true);
    let classId = "";
    if (createResult.success) {
      classId = createResult.data.id;
      expect(createResult.data.title).toBe("Admin Created Class");
      expect(createResult.data.status).toBe("SCHEDULED");
    }

    // ════════════════════════════════════════════════════════
    // Test 2: Teacher 1 can create a class for assigned Batch A
    // ════════════════════════════════════════════════════════
    const teacherCreateResult = await createLiveClassSession(
      {
        batchId: batchA.id,
        teacherId: teacher1Entity.id,
        title: "Teacher Created Class",
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: "SCHEDULED",
      },
      { id: teacher1User.id, role: "TEACHER", teacherId: teacher1Entity.id },
    );
    expect(teacherCreateResult.success).toBe(true);

    // ════════════════════════════════════════════════════════
    // Test 3: Teacher 2 cannot create a class for unassigned Batch A
    // ════════════════════════════════════════════════════════
    const unassignedCreateResult = await createLiveClassSession(
      {
        batchId: batchA.id,
        teacherId: teacher2Entity.id,
        title: "Should Fail",
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: "SCHEDULED",
      },
      { id: teacher2User.id, role: "TEACHER", teacherId: teacher2Entity.id },
    );
    expect(unassignedCreateResult.success).toBe(false);
    if (!unassignedCreateResult.success) {
      expect(unassignedCreateResult.error.code).toBe("FORBIDDEN");
    }

    // ════════════════════════════════════════════════════════
    // Test 4: Cannot create for archived batch
    // ════════════════════════════════════════════════════════
    const archivedBatchResult = await createLiveClassSession(
      {
        batchId: archivedBatch.id,
        teacherId: teacher1Entity.id,
        title: "Archived Batch Class",
        scheduledStartTime: startTime,
        scheduledEndTime: endTime,
        status: "SCHEDULED",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );
    expect(archivedBatchResult.success).toBe(false);
    if (!archivedBatchResult.success) {
      expect(archivedBatchResult.error.code).toBe("INVALID_LIFECYCLE");
    }

    // ════════════════════════════════════════════════════════
    // Test 5: End time must be after start time
    // ════════════════════════════════════════════════════════
    const invalidDatesResult = await createLiveClassSession(
      {
        batchId: batchA.id,
        teacherId: teacher1Entity.id,
        title: "Invalid Dates",
        scheduledStartTime: endTime,
        scheduledEndTime: startTime,
        status: "SCHEDULED",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );
    expect(invalidDatesResult.success).toBe(false);
    if (!invalidDatesResult.success) {
      expect(invalidDatesResult.error.code).toBe("VALIDATION_ERROR");
    }

    // ════════════════════════════════════════════════════════
    // Test 6: Update session
    // ════════════════════════════════════════════════════════
    const updateResult = await updateLiveClassSession(
      classId,
      {
        title: "Updated Title",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );
    expect(updateResult.success).toBe(true);
    if (updateResult.success) {
      expect(updateResult.data.title).toBe("Updated Title");
    }

    // ════════════════════════════════════════════════════════
    // Test 7: Cancel session
    // ════════════════════════════════════════════════════════
    const cancelResult = await cancelLiveClassSession(classId, {
      id: adminUser.id,
      role: "ADMIN",
      teacherId: null,
    });
    expect(cancelResult.success).toBe(true);
    if (cancelResult.success) {
      expect(cancelResult.data.status).toBe("CANCELLED");
    }

    // ════════════════════════════════════════════════════════
    // Test 8: Cannot edit cancelled session (except status)
    // ════════════════════════════════════════════════════════
    const editCancelledResult = await updateLiveClassSession(
      classId,
      {
        title: "Try edit cancelled",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );
    expect(editCancelledResult.success).toBe(false);
    if (!editCancelledResult.success) {
      expect(editCancelledResult.error.code).toBe("INVALID_LIFECYCLE");
    }

    // Can change status back to scheduled
    const uncancelResult = await updateLiveClassSession(
      classId,
      {
        status: "SCHEDULED",
      },
      { id: adminUser.id, role: "ADMIN", teacherId: null },
    );
    expect(uncancelResult.success).toBe(true);

    // ════════════════════════════════════════════════════════
    // Test 9: Visibility checks
    // ════════════════════════════════════════════════════════

    // Student A enrolled in Batch A sees sessions for Batch A
    const studentSessions = await getLiveClassSessionsForStudent(studentUser.id);
    expect(studentSessions.length).toBeGreaterThan(0);

    // Admin sees all sessions
    const adminSessions = await getLiveClassSessionsForAdmin();
    expect(adminSessions.length).toBeGreaterThan(0);

    // Teacher 1 sees sessions for their assigned batches
    const teacherSessions = await getLiveClassSessionsForTeacher(teacher1Entity.id);
    expect(teacherSessions.length).toBeGreaterThan(0);

    // Teacher 2 sees no sessions (assigned to no batches)
    const teacher2Sessions = await getLiveClassSessionsForTeacher(teacher2Entity.id);
    expect(teacher2Sessions.length).toBe(0);
  }, 60000);
});
