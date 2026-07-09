/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import { DomainError } from "../../../lib/domain/errors";

import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../../lib/test/db-isolation";

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

vi.mock("../../../lib/db", () => ({ db: testDbProxy }));

import {
  createTrack,
  listTracks,
  getTrackById,
  updateTrack,
  archiveTrack,
  restoreTrack,
} from "./tracks";

describe.skipIf(!isTestConfigured)("Curriculum Track Service (Integration)", () => {
  let testActor: ActorContext | null = null;
  let testBoardCBSE: any;
  let testBoardCISCE: any;
  let testProgramme: any;
  let testSubject: any;

  beforeAll(async () => {
    if (!isTestConfigured) return;
    const testDb = await initializeTestDb();
    if (!testDb) return;

    await testDb.auditLog.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.batchSchedule.deleteMany({});
    await testDb.homework.deleteMany({});
    await testDb.teacherAssignment.deleteMany({});
    await testDb.batch.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.programme.deleteMany({});
    await testDb.subject.deleteMany({});
    await testDb.board.deleteMany({});
    await testDb.fileAsset.deleteMany({});
    await testDb.appUser.deleteMany({});

    const appUser = await testDb.appUser.create({
      data: {
        role: "ADMIN",
        status: "ACTIVE",
        email: "test-admin@test.local",
        supabaseAuthUserId: "00000000-0000-4000-8000-000000000001",
      },
    });

    testActor = {
      userId: appUser.id,
      role: appUser.role,
      metadata: { role: appUser.role, status: appUser.status },
    };

    testBoardCBSE = await testDb.board.create({
      data: { code: "CBSE", name: "CBSE Board" },
    });
    testBoardCISCE = await testDb.board.create({
      data: { code: "CISCE", name: "CISCE Board" },
    });
    testProgramme = await testDb.programme.create({
      data: { boardId: testBoardCISCE.id, code: "ICSE", name: "ICSE Prog" },
    });
    testSubject = await testDb.subject.create({
      data: { code: "S_TRACK", name: "Sub Track" },
    });
  });

  afterAll(async () => {
    const testDb = (globalThis as any).__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.auditLog.deleteMany({});
      await testDb.topic.deleteMany({});
      await testDb.chapter.deleteMany({});
      await testDb.enrolment.deleteMany({});
      await testDb.batchSchedule.deleteMany({});
      await testDb.homework.deleteMany({});
      await testDb.teacherAssignment.deleteMany({});
      await testDb.batch.deleteMany({});
      await testDb.curriculumTrack.deleteMany({});
      await testDb.programme.deleteMany({});
      await testDb.subject.deleteMany({});
      await testDb.board.deleteMany({});
      await testDb.fileAsset.deleteMany({});
      await testDb.appUser.deleteMany({});
    }
    await teardownTestDb();
  });
  beforeEach(async () => {
    const testDb = (globalThis as any).__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.auditLog.deleteMany();
      await testDb.curriculumTrack.deleteMany();
    }
  });
  it("should create a track successfully with null programme", async () => {
    const track = await createTrack(testActor!, {
      boardId: testBoardCBSE.id,
      programmeId: null,
      classLevel: "IX",
      subjectId: testSubject.id,
      displayName: "IX Track",
    });
    expect(track.id).toBeDefined();
    expect(track.programmeId).toBeNull();

    // Prevent duplicate
    await expect(
      createTrack(testActor!, {
        boardId: testBoardCBSE.id,
        programmeId: null,
        classLevel: "IX",
        subjectId: testSubject.id,
        displayName: "IX Track Dup",
      }),
    ).rejects.toThrowError(/already exists/);
  });

  it("should create a track successfully with a programme", async () => {
    const track = await createTrack(testActor!, {
      boardId: testBoardCISCE.id,
      programmeId: testProgramme.id,
      classLevel: "X",
      subjectId: testSubject.id,
      displayName: "X Track P",
    });
    expect(track.id).toBeDefined();
    expect(track.programmeId).toBe(testProgramme.id);

    // Prevent duplicate
    await expect(
      createTrack(testActor!, {
        boardId: testBoardCISCE.id,
        programmeId: testProgramme.id,
        classLevel: "X",
        subjectId: testSubject.id,
        displayName: "X Track P Dup",
      }),
    ).rejects.toThrowError(/already exists/);
  });

  it("allows archive and independent restore", async () => {
    const track = await createTrack(testActor!, {
      boardId: testBoardCBSE.id,
      programmeId: null,
      classLevel: "XI",
      subjectId: testSubject.id,
      displayName: "XI Track",
    });

    const archived = await archiveTrack(testActor!, track.id);
    expect(archived.archivedAt).not.toBeNull();

    const restored = await restoreTrack(testActor!, track.id);
    expect(restored.archivedAt).toBeNull();
  });
});
