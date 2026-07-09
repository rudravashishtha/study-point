/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
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

import { createProgramme, archiveProgramme, restoreProgramme } from "./programmes";
import { createBoard } from "./boards";

let testActor: ActorContext | null = null;
let board1Id = "";
let board2Id = "";
let archivedBoardId = "";

beforeAll(async () => {
  if (!isTestConfigured) return;
  const testDb = await initializeTestDb();
  if (!testDb) return;

  await testDb.auditLog.deleteMany({});
  await testDb.topic.deleteMany({});
  await testDb.chapter.deleteMany({});
  await testDb.enrolment.deleteMany({});
  await testDb.curriculumTrack.deleteMany({});
  await testDb.programme.deleteMany({});
  await testDb.subject.deleteMany({});
  await testDb.board.deleteMany({});
  await testDb.appUser.deleteMany({});

  const appUser = await testDb.appUser.create({
    data: {
      role: "ADMIN",
      status: "ACTIVE",
      email: "test-admin2@test.local",
      supabaseAuthUserId: "00000000-0000-4000-8000-000000000002",
    },
  });

  testActor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: { role: appUser.role, status: appUser.status },
  };

  const b1 = await createBoard(testActor, { code: "B1", name: "Board 1" });
  const b2 = await createBoard(testActor, { code: "B2", name: "Board 2" });
  const ba = await createBoard(testActor, { code: "BA", name: "Board Archived" });
  await testDb.board.update({ where: { id: ba.id }, data: { archivedAt: new Date() } });

  board1Id = b1.id;
  board2Id = b2.id;
  archivedBoardId = ba.id;
});

afterAll(async () => {
  const testDb = (globalThis as any).__testDb as PrismaClient | null;
  if (testDb) {
    await testDb.auditLog.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.programme.deleteMany({});
    await testDb.subject.deleteMany({});
    await testDb.board.deleteMany({});
    await testDb.appUser.deleteMany({});
  }
  await teardownTestDb();
});

describe.skipIf(!isTestConfigured)("Programmes Integration", () => {
  it("enforces permanent [boardId, code] uniqueness", async () => {
    if (!testActor) throw new Error("Missing actor");
    const p1 = await createProgramme(testActor, {
      boardId: board1Id,
      code: "ICSE",
      name: "ICSE",
    });
    expect(p1.code).toBe("ICSE");

    await expect(
      createProgramme(testActor, { boardId: board1Id, code: "ICSE", name: "Other" }),
    ).rejects.toMatchObject({
      code: "DUPLICATE_IDENTITY",
    });
  });

  it("same programme code is allowed under a different board", async () => {
    if (!testActor) throw new Error("Missing actor");
    const p2 = await createProgramme(testActor, {
      boardId: board2Id,
      code: "ICSE",
      name: "ICSE under B2",
    });
    expect(p2.code).toBe("ICSE");
  });

  it("archived programme still reserves its board-scoped identity", async () => {
    if (!testActor) throw new Error("Missing actor");
    const p = await createProgramme(testActor, {
      boardId: board1Id,
      code: "ARC_PROG",
      name: "Arc",
    });
    await archiveProgramme(testActor, p.id);

    await expect(
      createProgramme(testActor, {
        boardId: board1Id,
        code: "ARC_PROG",
        name: "Arc New",
      }),
    ).rejects.toMatchObject({
      code: "DUPLICATE_IDENTITY",
    });
  });

  it("rejects creation if board is archived", async () => {
    if (!testActor) throw new Error("Missing actor");
    await expect(
      createProgramme(testActor, {
        boardId: archivedBoardId,
        code: "TEST",
        name: "Test",
      }),
    ).rejects.toMatchObject({
      code: "INVALID_LIFECYCLE",
    });
  });

  it("programme archive blocked by unarchived Curriculum Track", async () => {
    if (!testActor) throw new Error("Missing actor");
    const testDb = (globalThis as any).__testDb as PrismaClient;
    const p = await createProgramme(testActor, {
      boardId: board1Id,
      code: "P_BLOCK",
      name: "P Block",
    });

    // Create a subject first
    const s = await testDb.subject.create({
      data: { code: "S1", name: "S1", createdBy: testActor.userId },
    });

    // Mock a curriculum track
    const ct = await testDb.curriculumTrack.create({
      data: {
        boardId: board1Id,
        programmeId: p.id,
        subjectId: s.id,
        classLevel: "IX",
        displayName: "Trk",
        createdBy: testActor.userId,
      },
    });

    await expect(archiveProgramme(testActor, p.id)).rejects.toMatchObject({
      code: "ARCHIVE_BLOCKED",
    });

    // Archive track
    await testDb.curriculumTrack.update({
      where: { id: ct.id },
      data: { archivedAt: new Date(), archivedBy: testActor.userId },
    });

    const res = await archiveProgramme(testActor, p.id);
    expect(res.archivedAt).not.toBeNull();
  });

  it("restore succeeds even when the programme's parent board remains archived", async () => {
    if (!testActor) throw new Error("Missing actor");
    const testDb = (globalThis as any).__testDb as PrismaClient;

    const p = await createProgramme(testActor, {
      boardId: board1Id,
      code: "P_REST",
      name: "Restore test",
    });
    await archiveProgramme(testActor, p.id);

    // Archive parent board
    await testDb.board.update({
      where: { id: board1Id },
      data: { archivedAt: new Date(), archivedBy: testActor.userId },
    });

    // Restore programme should still succeed
    const res = await restoreProgramme(testActor, p.id);
    expect(res.archivedAt).toBeNull();
  });
});
