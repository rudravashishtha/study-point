import { describe, it, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../src/lib/test/db-isolation";

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

vi.mock("../src/lib/db", () => ({ db: testDbProxy }));

describe.skipIf(!isTestConfigured)("Inspect P2002", () => {
  beforeAll(async () => {
    if (!isTestConfigured) return;
    const testDb = await initializeTestDb();
    if (!testDb) return;
    await testDb.homework.deleteMany({});
    await testDb.fileAsset.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.batchSchedule.deleteMany({});
    await testDb.teacherAssignment.deleteMany({});
    await testDb.test.deleteMany({});
    await testDb.batch.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.subject.deleteMany({ where: { code: "TEST_S" } });
    await testDb.board.deleteMany({ where: { code: "TEST_B" } });
  });

  afterAll(async () => {
    const testDb = (globalThis as Record<string, unknown>)
      .__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.homework.deleteMany({});
      await testDb.fileAsset.deleteMany({});
      await testDb.enrolment.deleteMany({});
      await testDb.batchSchedule.deleteMany({});
      await testDb.teacherAssignment.deleteMany({});
      await testDb.test.deleteMany({});
      await testDb.batch.deleteMany({});
      await testDb.topic.deleteMany({});
      await testDb.chapter.deleteMany({});
      await testDb.curriculumTrack.deleteMany({});
      await testDb.subject.deleteMany({ where: { code: "TEST_S" } });
      await testDb.board.deleteMany({ where: { code: "TEST_B" } });
    }
    await teardownTestDb();
  });

  it("logs P2002 structure", async () => {
    const testDb = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
    const board = await testDb.board.create({ data: { code: "TEST_B", name: "B" } });
    const subject = await testDb.subject.create({ data: { code: "TEST_S", name: "S" } });

    await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "IX",
        displayName: "T1",
      },
    });

    try {
      await testDb.curriculumTrack.create({
        data: {
          boardId: board.id,
          subjectId: subject.id,
          classLevel: "IX",
          displayName: "T2", // Duplicate
        },
      });
    } catch (err: unknown) {
      console.log("=========================================");
      const errRecord = err as Record<string, unknown>;
      const meta = errRecord.meta as Record<string, unknown> | undefined;
      const driverAdapterError = meta?.driverAdapterError as
        Record<string, unknown> | undefined;
      const cause = driverAdapterError?.cause as Record<string, unknown> | undefined;
      console.log("P2002 ERROR CAUSE:", JSON.stringify(cause, null, 2));
      console.log(
        "P2002 ERROR ORIGINAL MSG:",
        cause?.originalMessage || errRecord.message,
      );
      console.log("=========================================");
    }
  });
});
