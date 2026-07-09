import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient, PermissionCapability } from "@prisma/client";
import { ActorContext } from "@/lib/domain/actor";

const { testDbProxy } = vi.hoisted(() => {
  return {
    testDbProxy: new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (!(globalThis as any).__testDb) throw new Error("testDb is not initialized");
        return ((globalThis as any).__testDb as any)[prop];
      },
    }),
  };
});

vi.mock("../../lib/db", () => ({
  db: testDbProxy,
}));

import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../lib/test/db-isolation";
import {
  assignTeacherToBatch,
  updateTeacherAssignmentPermissions,
  removeTeacherFromBatch,
  restoreTeacherAssignment,
} from "./teacher-assignments";

let testActor: ActorContext | null = null;

beforeAll(async () => {
  if (!isTestConfigured) return;

  const testDb = await initializeTestDb();
  if (!testDb) return;

  await testDb.auditLog.deleteMany({});
  await testDb.teacherAssignment.deleteMany({});
  await testDb.batch.deleteMany({});
  await testDb.teacher.deleteMany({});
  await testDb.enrolment.deleteMany({});
  await testDb.curriculumTrack.deleteMany({});
  await testDb.subject.deleteMany({});
  await testDb.board.deleteMany({});
  await testDb.academicSession.deleteMany({});
  await testDb.appUser.deleteMany({});

  const appUser = await testDb.appUser.create({
    data: { role: "ADMIN", status: "ACTIVE", email: "admin@test.local" },
  });

  testActor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: { role: appUser.role, status: appUser.status },
  };
});

afterAll(async () => {
  const testDb = (globalThis as any).__testDb;
  if (testDb) {
    await testDb.auditLog.deleteMany({});
    await testDb.teacherAssignment.deleteMany({});
    await testDb.batch.deleteMany({});
    await testDb.teacher.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.subject.deleteMany({});
    await testDb.board.deleteMany({});
    await testDb.academicSession.deleteMany({});
    await testDb.appUser.deleteMany({});
  }
  await teardownTestDb();
});

describe.skipIf(!isTestConfigured)("Teacher Assignments Service Integration", () => {
  let testDb: PrismaClient;
  let activeTeacherId: string;
  let inactiveTeacherId: string;
  let activeBatchId: string;
  let archivedBatchId: string;

  beforeAll(async () => {
    testDb = (globalThis as any).__testDb;
    if (!testDb) return;

    const s = await testDb.academicSession.create({ data: { name: "TS" } });
    const bCode = "B-" + Math.random().toString(36).substring(7);
    const sCode = "S-" + Math.random().toString(36).substring(7);
    const board = await testDb.board.create({ data: { code: bCode, name: bCode } });
    const subj = await testDb.subject.create({ data: { code: sCode, name: sCode } });
    const track = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subj.id,
        classLevel: "X",
        displayName: "TTr",
      },
    });

    const b = await testDb.batch.create({
      data: { name: "TB", academicSessionId: s.id, curriculumTrackId: track.id },
    });
    activeBatchId = b.id;

    const b2 = await testDb.batch.create({
      data: {
        name: "TB Arch",
        academicSessionId: s.id,
        curriculumTrackId: track.id,
        archivedAt: new Date(),
      },
    });
    archivedBatchId = b2.id;

    const t = await testDb.teacher.create({ data: { displayName: "TT" } });
    activeTeacherId = t.id;

    const t2 = await testDb.teacher.create({
      data: { displayName: "TT Inactive", active: false },
    });
    inactiveTeacherId = t2.id;
  });

  it("rejects empty permissions []", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: activeBatchId,
      permissions: [],
    });
    expect(res.type).toBe("INVALID_PERMISSIONS");
  });

  it("rejects missing explicit BATCH_VIEW (e.g. ['ATTENDANCE_MANAGE'])", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: activeBatchId,
      permissions: [PermissionCapability.ATTENDANCE_MANAGE],
    });
    expect(res.type).toBe("INVALID_PERMISSIONS");
  });

  it("rejects assignment if teacher is inactive", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: inactiveTeacherId,
      batchId: activeBatchId,
      permissions: [PermissionCapability.BATCH_VIEW],
    });
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });

  it("rejects assignment if batch is archived", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: archivedBatchId,
      permissions: [PermissionCapability.BATCH_VIEW],
    });
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });

  it("assigns teacher successfully", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: activeBatchId,
      permissions: [PermissionCapability.BATCH_VIEW, PermissionCapability.MEMBERS_VIEW],
    });
    if (res.type !== "SUCCESS") return expect(res.type).toBe("SUCCESS");

    const audits = await testDb.auditLog.findMany({
      where: { entityId: res.data?.id, action: "CREATE" },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].metadata).toMatchObject({
      permissions: ["BATCH_VIEW", "MEMBERS_VIEW"],
    });
  });

  it("duplicate active assignment maps to DUPLICATE_IDENTITY", async () => {
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: activeBatchId,
      permissions: [PermissionCapability.BATCH_VIEW],
    });
    expect(res.type).toBe("DUPLICATE_IDENTITY");
  });

  it("permission update stores exactly the selected explicit array", async () => {
    const assgn = await testDb.teacherAssignment.findFirst({
      where: { teacherId: activeTeacherId, batchId: activeBatchId, archivedAt: null },
    });
    const id = assgn!.id;

    const res = await updateTeacherAssignmentPermissions(testActor!, id, activeBatchId, [
      PermissionCapability.BATCH_VIEW,
      PermissionCapability.MEMBERS_MANAGE,
    ]);
    expect(res.type).toBe("SUCCESS");

    // Verify it saved exactly the two
    const updated = await testDb.teacherAssignment.findUnique({ where: { id } });
    expect(updated?.permissions).toEqual(["BATCH_VIEW", "MEMBERS_MANAGE"]);
  });

  it("permission update audit contains exact previousPermissions and newPermissions", async () => {
    const assgn = await testDb.teacherAssignment.findFirst({
      where: { teacherId: activeTeacherId, batchId: activeBatchId, archivedAt: null },
    });
    const id = assgn!.id;

    const audits = await testDb.auditLog.findMany({
      where: { entityId: id, action: "UPDATE" },
    });
    expect(audits).toHaveLength(1);
    expect(audits[0].metadata).toMatchObject({
      previousPermissions: ["BATCH_VIEW", "MEMBERS_VIEW"],
      newPermissions: ["BATCH_VIEW", "MEMBERS_MANAGE"],
    });
  });

  it("removes active assignment with audit", async () => {
    const assgn = await testDb.teacherAssignment.findFirst({
      where: { teacherId: activeTeacherId, batchId: activeBatchId, archivedAt: null },
    });
    const id = assgn!.id;

    const res = await removeTeacherFromBatch(testActor!, id, activeBatchId);
    expect(res.type).toBe("SUCCESS");

    const audits = await testDb.auditLog.findMany({
      where: { entityId: id, action: "ARCHIVE" },
    });
    expect(audits).toHaveLength(1);
  });

  it("archived historical assignment allows a new active assignment", async () => {
    // Current assignment is archived (from previous test)
    // We should be able to create a new one
    const res = await assignTeacherToBatch(testActor!, {
      teacherId: activeTeacherId,
      batchId: activeBatchId,
      permissions: [PermissionCapability.BATCH_VIEW],
    });
    expect(res.type).toBe("SUCCESS");
  });

  it("restoring an old assignment colliding with a newer active assignment maps to DUPLICATE_IDENTITY", async () => {
    // Get the archived one
    const oldAssgn = await testDb.teacherAssignment.findFirst({
      where: {
        teacherId: activeTeacherId,
        batchId: activeBatchId,
        archivedAt: { not: null },
      },
    });

    // Attempt restore
    const res = await restoreTeacherAssignment(testActor!, oldAssgn!.id);
    expect(res.type).toBe("DUPLICATE_IDENTITY");
  });
  it("restoring assignment for inactive Teacher is rejected", async () => {
    // First, let's create an assignment for inactiveTeacherId, but how?
    // We can't assign inactive teacher. So let's insert it manually or use an active one then archive it.
    const tempT = await testDb.teacher.create({
      data: { displayName: "Temp", active: true },
    });
    const tempAssgn = await testDb.teacherAssignment.create({
      data: {
        teacherId: tempT.id,
        batchId: activeBatchId,
        permissions: [PermissionCapability.BATCH_VIEW],
        archivedAt: new Date(),
      },
    });
    // Now make the teacher inactive
    await testDb.teacher.update({ where: { id: tempT.id }, data: { active: false } });

    const res = await restoreTeacherAssignment(testActor!, tempAssgn.id);
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });

  it("restoring assignment for archived Batch is rejected", async () => {
    const tempAssgn = await testDb.teacherAssignment.create({
      data: {
        teacherId: activeTeacherId,
        batchId: archivedBatchId,
        permissions: [PermissionCapability.BATCH_VIEW],
        archivedAt: new Date(),
      },
    });

    const res = await restoreTeacherAssignment(testActor!, tempAssgn.id);
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });
});
