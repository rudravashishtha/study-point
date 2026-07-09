import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
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
import { createTeacher, updateTeacher, archiveTeacher, restoreTeacher } from "./teachers";

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
    data: {
      role: "ADMIN",
      status: "ACTIVE",
      email: "test-admin@test.local",
    },
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

describe.skipIf(!isTestConfigured)("Teachers Service Integration", () => {
  let testDb: PrismaClient;

  beforeAll(() => {
    testDb = (globalThis as any).__testDb;
  });

  it("creates a teacher and logs audit", async () => {
    const res = await createTeacher(testActor!, { displayName: "T1" });
    expect(res.type).toBe("SUCCESS");

    const audits = await testDb.auditLog.findMany({ where: { entityId: res.data?.id } });
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe("CREATE");
  });

  it("updates teacher successfully", async () => {
    const createRes = await createTeacher(testActor!, { displayName: "T2" });
    const teacherId = createRes.data!.id;

    const res = await updateTeacher(testActor!, teacherId, { displayName: "T2 Updated" });
    expect(res.type).toBe("SUCCESS");
    expect(res.data?.displayName).toBe("T2 Updated");

    const audits = await testDb.auditLog.findMany({
      where: { entityId: teacherId, action: "UPDATE" },
    });
    expect(audits).toHaveLength(1);
  });

  it("cannot update inactive teacher", async () => {
    const createRes = await createTeacher(testActor!, { displayName: "T3" });
    const teacherId = createRes.data!.id;

    await archiveTeacher(testActor!, teacherId);

    const res = await updateTeacher(testActor!, teacherId, { displayName: "Fail" });
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });

  it("cannot archive already inactive teacher", async () => {
    const createRes = await createTeacher(testActor!, { displayName: "T4" });
    const teacherId = createRes.data!.id;

    await archiveTeacher(testActor!, teacherId);

    const res = await archiveTeacher(testActor!, teacherId);
    expect(res.type).toBe("INVALID_LIFECYCLE");
  });

  it("restoring an active teacher is a no-op", async () => {
    const createRes = await createTeacher(testActor!, { displayName: "T5" });
    const teacherId = createRes.data!.id;

    const res = await restoreTeacher(testActor!, teacherId);
    expect(res.type).toBe("SUCCESS");

    const restores = await testDb.auditLog.findMany({
      where: { entityId: teacherId, action: "RESTORE" },
    });
    expect(restores).toHaveLength(0); // no-op
  });

  it("restoring an inactive teacher works and logs audit", async () => {
    const createRes = await createTeacher(testActor!, { displayName: "T6" });
    const teacherId = createRes.data!.id;

    await archiveTeacher(testActor!, teacherId);

    const res = await restoreTeacher(testActor!, teacherId);
    if (res.type !== "SUCCESS") return expect(res.type).toBe("SUCCESS");

    const dbTeacher = await testDb.teacher.findUnique({ where: { id: teacherId } });
    expect(dbTeacher?.active).toBe(true);

    const restores = await testDb.auditLog.findMany({
      where: { entityId: teacherId, action: "RESTORE" },
    });
    expect(restores).toHaveLength(1);
  });

  it("blocks archiving if active assignments exist", async () => {
    const tRes = await createTeacher(testActor!, { displayName: "T7" });
    const tId = tRes.data!.id;

    const s = await testDb.academicSession.create({ data: { name: "S7" } });
    const bCode = "B-" + Math.random().toString(36).substring(7);
    const sCode = "S-" + Math.random().toString(36).substring(7);
    const board = await testDb.board.create({ data: { code: bCode, name: bCode } });
    const subj = await testDb.subject.create({ data: { code: sCode, name: sCode } });
    const track = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subj.id,
        classLevel: "X",
        displayName: "Tr7",
      },
    });

    const b = await testDb.batch.create({
      data: { name: "B7", academicSessionId: s.id, curriculumTrackId: track.id },
    });

    await testDb.teacherAssignment.create({
      data: {
        teacherId: tId,
        batchId: b.id,
        permissions: ["BATCH_VIEW"],
      },
    });

    const res = await archiveTeacher(testActor!, tId);
    expect(res.type).toBe("ARCHIVE_BLOCKED");
  });

  it("allows archiving if only archived assignments exist", async () => {
    const tRes = await createTeacher(testActor!, { displayName: "T8" });
    const tId = tRes.data!.id;

    const s = await testDb.academicSession.create({ data: { name: "S8" } });
    const bCode = "B-" + Math.random().toString(36).substring(7);
    const sCode = "S-" + Math.random().toString(36).substring(7);
    const board = await testDb.board.create({ data: { code: bCode, name: bCode } });
    const subj = await testDb.subject.create({ data: { code: sCode, name: sCode } });
    const track = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subj.id,
        classLevel: "X",
        displayName: "Tr8",
      },
    });

    const b = await testDb.batch.create({
      data: { name: "B8", academicSessionId: s.id, curriculumTrackId: track.id },
    });

    await testDb.teacherAssignment.create({
      data: {
        teacherId: tId,
        batchId: b.id,
        permissions: ["BATCH_VIEW"],
        archivedAt: new Date(),
      },
    });

    const res = await archiveTeacher(testActor!, tId);
    expect(res.type).toBe("SUCCESS");
  });
});
