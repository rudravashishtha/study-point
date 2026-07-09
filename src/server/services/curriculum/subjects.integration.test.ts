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

import { createSubject, archiveSubject } from "./subjects";

let testActor: ActorContext | null = null;

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
      email: "test-admin3@test.local",
      supabaseAuthUserId: "00000000-0000-4000-8000-000000000003",
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
    await testDb.curriculumTrack.deleteMany({});
    await testDb.programme.deleteMany({});
    await testDb.subject.deleteMany({});
    await testDb.board.deleteMany({});
    await testDb.appUser.deleteMany({});
  }
  await teardownTestDb();
});

describe.skipIf(!isTestConfigured)("Subjects Integration", () => {
  it("enforces permanent code uniqueness", async () => {
    if (!testActor) throw new Error("Missing actor");
    const s1 = await createSubject(testActor, { code: "MATH_TEST", name: "Mathematics" });
    expect(s1.code).toBe("MATH_TEST");

    await expect(
      createSubject(testActor, { code: "MATH_TEST", name: "Other" }),
    ).rejects.toMatchObject({
      code: "DUPLICATE_IDENTITY",
    });
  });

  it("archived subject still reserves its code", async () => {
    if (!testActor) throw new Error("Missing actor");
    const s = await createSubject(testActor, { code: "S_ARC", name: "Subject" });
    await archiveSubject(testActor, s.id);

    await expect(
      createSubject(testActor, { code: "S_ARC", name: "New" }),
    ).rejects.toMatchObject({
      code: "DUPLICATE_IDENTITY",
    });
  });

  it("subject archive blocked by unarchived Curriculum Track", async () => {
    if (!testActor) throw new Error("Missing actor");
    const testDb = (globalThis as any).__testDb as PrismaClient;

    const b = await testDb.board.create({
      data: { code: "B3", name: "B3", createdBy: testActor.userId },
    });
    const s = await createSubject(testActor, { code: "S_BLOCK", name: "S1" });

    const ct = await testDb.curriculumTrack.create({
      data: {
        boardId: b.id,
        subjectId: s.id,
        classLevel: "X",
        displayName: "Trk",
        createdBy: testActor.userId,
      },
    });

    await expect(archiveSubject(testActor, s.id)).rejects.toMatchObject({
      code: "ARCHIVE_BLOCKED",
    });

    // Archive track
    await testDb.curriculumTrack.update({
      where: { id: ct.id },
      data: { archivedAt: new Date(), archivedBy: testActor.userId },
    });

    // Now it works
    const res = await archiveSubject(testActor, s.id);
    expect(res.archivedAt).not.toBeNull();
  });
});
