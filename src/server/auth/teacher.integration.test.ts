import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { PrismaClient, PermissionCapability, Role } from "@prisma/client";

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

// Mock the upstream getAppUser to simulate different auth sessions
let mockAppUser: Record<string, unknown> | null = null;
vi.mock("../../lib/auth/permissions", () => ({
  getAppUser: vi.fn().mockImplementation(async () => mockAppUser),
}));

import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../lib/test/db-isolation";
import { getTeacherContext, requireTeacherPermission } from "./teacher";

beforeAll(async () => {
  if (!isTestConfigured) return;

  const testDb = await initializeTestDb();
  if (!testDb) return;

  // Cleanup
  await testDb.teacherAssignment.deleteMany({});
  await testDb.homework.deleteMany({});
  await testDb.test.deleteMany({});
  await testDb.batch.deleteMany({});
  await testDb.teacher.deleteMany({});
  await testDb.enrolment.deleteMany({});
  await testDb.topic.deleteMany({});
  await testDb.chapter.deleteMany({});
  await testDb.curriculumTrack.deleteMany({});
  await testDb.subject.deleteMany({});
  await testDb.board.deleteMany({});
  await testDb.academicSession.deleteMany({});
  await testDb.fileAsset.deleteMany({});
  await testDb.appUser.deleteMany({});
});

afterAll(async () => {
  const testDb = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
  if (testDb) {
    await testDb.teacherAssignment.deleteMany({});
    await testDb.homework.deleteMany({});
    await testDb.test.deleteMany({});
    await testDb.batch.deleteMany({});
    await testDb.teacher.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.subject.deleteMany({});
    await testDb.board.deleteMany({});
    await testDb.academicSession.deleteMany({});
    await testDb.fileAsset.deleteMany({});
    await testDb.appUser.deleteMany({});
  }
  await teardownTestDb();
});

describe.skipIf(!isTestConfigured)("Teacher Authorization Core Integration", () => {
  let testDb: PrismaClient;
  let sId: string;
  let trackId: string;
  let batchA: string;
  let batchB: string;
  let teacherId: string;
  let inactiveTeacherId: string;

  beforeAll(async () => {
    testDb = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
    if (!testDb) return;

    // Create prerequisites
    const session = await testDb.academicSession.create({
      data: { name: "Test Session" },
    });
    sId = session.id;

    const bCode = "B-" + Math.random().toString(36).substring(7);
    const sCode = "S-" + Math.random().toString(36).substring(7);
    const board = await testDb.board.create({ data: { code: bCode, name: bCode } });
    const subj = await testDb.subject.create({ data: { code: sCode, name: sCode } });
    const track = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subj.id,
        classLevel: "X",
        displayName: "X S1",
      },
    });
    trackId = track.id;

    const bA = await testDb.batch.create({
      data: {
        name: "Batch A",
        academicSessionId: sId,
        curriculumTrackId: trackId,
      },
    });
    batchA = bA.id;

    const bB = await testDb.batch.create({
      data: {
        name: "Batch B",
        academicSessionId: sId,
        curriculumTrackId: trackId,
      },
    });
    batchB = bB.id;

    const t = await testDb.teacher.create({
      data: { displayName: "Active Teacher", active: true },
    });
    teacherId = t.id;

    const t2 = await testDb.teacher.create({
      data: { displayName: "Inactive Teacher", active: false },
    });
    inactiveTeacherId = t2.id;
  });

  beforeEach(() => {
    mockAppUser = null;
  });

  it("ADMIN bypass succeeds universally", async () => {
    mockAppUser = { id: "u-admin", role: Role.ADMIN, status: "ACTIVE" };
    const ctx = await getTeacherContext(batchA);
    expect(ctx.isAuthorized).toBe(true);
    expect(ctx.isAdmin).toBe(true);

    // require should not throw
    await expect(
      requireTeacherPermission(batchA, PermissionCapability.BATCH_MANAGE),
    ).resolves.not.toThrow();
  });

  it("denies access if appUser is inactive", async () => {
    mockAppUser = { id: "u-teacher", role: Role.TEACHER, status: "DISABLED", teacherId };
    const ctx = await getTeacherContext(batchA);
    expect(ctx.isAuthorized).toBe(false);
    await expect(
      requireTeacherPermission(batchA, PermissionCapability.BATCH_VIEW),
    ).rejects.toThrow("Unauthorized");
  });

  it("non-Teacher, non-Admin role is denied", async () => {
    mockAppUser = { id: "u-student", role: Role.STUDENT, status: "ACTIVE" };
    const ctx = await getTeacherContext(batchA);
    expect(ctx.isAuthorized).toBe(false);
    await expect(
      requireTeacherPermission(batchA, PermissionCapability.BATCH_VIEW),
    ).rejects.toThrow("Unauthorized");
  });

  it("denies TEACHER role if not linked to a Teacher profile", async () => {
    mockAppUser = {
      id: "u-unlinked",
      role: Role.TEACHER,
      status: "ACTIVE",
      teacherId: null,
    };
    const ctx = await getTeacherContext(batchA);
    expect(ctx.isAuthorized).toBe(false);
  });

  it("inactive Teacher immediately revokes access", async () => {
    mockAppUser = {
      id: "u-inactive",
      role: Role.TEACHER,
      status: "ACTIVE",
      teacherId: inactiveTeacherId,
    };
    const ctx = await getTeacherContext(batchA);
    expect(ctx.isAuthorized).toBe(false);
  });

  it("denies TEACHER role if Batch is archived", async () => {
    mockAppUser = { id: "u-t1", role: Role.TEACHER, status: "ACTIVE", teacherId };
    const archivedBatch = await testDb.batch.create({
      data: {
        name: "Archived Batch",
        academicSessionId: sId,
        curriculumTrackId: trackId,
        archivedAt: new Date(),
      },
    });

    const ctx = await getTeacherContext(archivedBatch.id);
    expect(ctx.isAuthorized).toBe(false);
  });

  it("inactive Batch does not deny Teacher authorization", async () => {
    mockAppUser = { id: "u-t1", role: Role.TEACHER, status: "ACTIVE", teacherId };
    const inactiveBatch = await testDb.batch.create({
      data: {
        name: "Inactive Batch",
        academicSessionId: sId,
        curriculumTrackId: trackId,
        isActive: false, // inactive but not archived
      },
    });

    await testDb.teacherAssignment.create({
      data: {
        teacherId,
        batchId: inactiveBatch.id,
        permissions: [PermissionCapability.BATCH_VIEW],
      },
    });

    const ctx = await getTeacherContext(inactiveBatch.id);
    expect(ctx.isAuthorized).toBe(true);
  });

  describe("with active teacher and active batch", () => {
    beforeEach(async () => {
      mockAppUser = { id: "u-t1", role: Role.TEACHER, status: "ACTIVE", teacherId };
      await testDb.teacherAssignment.deleteMany({});
    });

    it("denies access if no assignment exists", async () => {
      const ctx = await getTeacherContext(batchA);
      expect(ctx.isAuthorized).toBe(false);
      await expect(
        requireTeacherPermission(batchA, PermissionCapability.BATCH_VIEW),
      ).rejects.toThrow("Unauthorized");
    });

    it("TEACHER assigned to Batch A is denied for Batch B", async () => {
      await testDb.teacherAssignment.create({
        data: {
          teacherId,
          batchId: batchB,
          permissions: [PermissionCapability.BATCH_VIEW],
        },
      });

      // Requesting batch A
      const ctx = await getTeacherContext(batchA);
      expect(ctx.isAuthorized).toBe(false);
    });

    it("archived TeacherAssignment immediately revokes access", async () => {
      await testDb.teacherAssignment.create({
        data: {
          teacherId,
          batchId: batchA,
          permissions: [PermissionCapability.BATCH_VIEW],
          archivedAt: new Date(),
        },
      });

      const ctx = await getTeacherContext(batchA);
      expect(ctx.isAuthorized).toBe(false);
    });

    describe("explicit permission checks", () => {
      beforeEach(async () => {
        await testDb.teacherAssignment.create({
          data: {
            teacherId,
            batchId: batchA,
            permissions: [PermissionCapability.BATCH_MANAGE],
          },
        });
      });

      it("TEACHER with direct capability succeeds", async () => {
        const ctx = await getTeacherContext(batchA);
        expect(ctx.isAuthorized).toBe(true);
        expect(ctx.storedPermissions).toContain(PermissionCapability.BATCH_MANAGE);

        await expect(
          requireTeacherPermission(batchA, PermissionCapability.BATCH_MANAGE),
        ).resolves.not.toThrow();
      });

      it("TEACHER with implied VIEW capability succeeds", async () => {
        const ctx = await getTeacherContext(batchA);
        expect(ctx.effectivePermissions).toContain(PermissionCapability.BATCH_VIEW);

        await expect(
          requireTeacherPermission(batchA, PermissionCapability.BATCH_VIEW),
        ).resolves.not.toThrow();
      });

      it("TEACHER without requested capability is denied", async () => {
        await expect(
          requireTeacherPermission(batchA, PermissionCapability.MEMBERS_VIEW),
        ).rejects.toThrow("Forbidden");
      });
    });
  });
});
