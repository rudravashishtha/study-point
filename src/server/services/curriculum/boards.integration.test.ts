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

import { createBoard, updateBoard, archiveBoard, restoreBoard } from "./boards";

let testActor: ActorContext | null = null;

beforeAll(async () => {
  if (!isTestConfigured) return;
  const testDb = await initializeTestDb();
  if (!testDb) return;

  await testDb.auditLog.deleteMany({});
  await testDb.topic.deleteMany({});
  await testDb.chapter.deleteMany({});
  await testDb.enrolment.deleteMany({});
  await testDb.batchSchedule.deleteMany({});
  await testDb.teacherAssignment.deleteMany({});
  await testDb.homework.deleteMany({});
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
});

afterAll(async () => {
  const testDb = (globalThis as any).__testDb as PrismaClient | null;
  if (testDb) {
    await testDb.auditLog.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.batchSchedule.deleteMany({});
    await testDb.homework.deleteMany({});
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

describe.skipIf(!isTestConfigured)("Boards Integration", () => {
  it("enforces permanent code uniqueness and maps to DUPLICATE_IDENTITY", async () => {
    if (!testActor) throw new Error("Missing actor");
    const testDb = (globalThis as any).__testDb as PrismaClient;

    const b1 = await createBoard(testActor, { code: "CBSE_TEST", name: "CBSE" });
    expect(b1.code).toBe("CBSE_TEST");

    // Check successful audit log exists
    const audits = await testDb.auditLog.findMany({
      where: { action: "CREATE", entityId: b1.id },
    });
    expect(audits.length).toBe(1);

    const err = await createBoard(testActor, { code: "CBSE_TEST", name: "Other" }).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(DomainError);
    expect(err.code).toBe("DUPLICATE_IDENTITY");

    // Verify failed mutation leaves no audit log
    const failedAudits = await testDb.auditLog.findMany({
      where: { summary: "Created board: CBSE_TEST", entityId: { not: b1.id } },
    });
    expect(failedAudits.length).toBe(0);
  });

  it("archived board still reserves its code", async () => {
    if (!testActor) throw new Error("Missing actor");
    const b = await createBoard(testActor, { code: "B_ARC", name: "Board" });
    await archiveBoard(testActor, b.id);

    await expect(
      createBoard(testActor, { code: "B_ARC", name: "New" }),
    ).rejects.toMatchObject({
      code: "DUPLICATE_IDENTITY",
    });
  });

  it("board archive blocked by unarchived Programme or Track", async () => {
    if (!testActor) throw new Error("Missing actor");
    const testDb = (globalThis as any).__testDb as PrismaClient;

    const b = await createBoard(testActor, { code: "B_BLOCK_PROG", name: "B1" });
    const p = await testDb.programme.create({
      data: { boardId: b.id, code: "ICSE", name: "ICSE", createdBy: testActor.userId },
    });

    await expect(archiveBoard(testActor, b.id)).rejects.toMatchObject({
      code: "ARCHIVE_BLOCKED",
    });

    // Archive programme
    await testDb.programme.update({
      where: { id: p.id },
      data: { archivedAt: new Date(), archivedBy: testActor.userId },
    });

    // Now it works
    const res = await archiveBoard(testActor, b.id);
    expect(res.archivedAt).not.toBeNull();
  });
});
