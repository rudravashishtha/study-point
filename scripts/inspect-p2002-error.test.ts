import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../src/lib/test/db-isolation";

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
    await testDb.batch.deleteMany({});
    await testDb.topic.deleteMany({});
    await testDb.chapter.deleteMany({});
    await testDb.curriculumTrack.deleteMany({});
    await testDb.subject.deleteMany({ where: { code: "TEST_S" } });
    await testDb.board.deleteMany({ where: { code: "TEST_B" } });
  });

  afterAll(async () => {
    const testDb = (globalThis as any).__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.homework.deleteMany({});
      await testDb.fileAsset.deleteMany({});
      await testDb.enrolment.deleteMany({});
      await testDb.batchSchedule.deleteMany({});
      await testDb.teacherAssignment.deleteMany({});
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
    const testDb = (globalThis as any).__testDb as PrismaClient;
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
    } catch (err: any) {
      console.log("=========================================");
      console.log(
        "P2002 ERROR CAUSE:",
        JSON.stringify(err.meta?.driverAdapterError?.cause, null, 2),
      );
      console.log(
        "P2002 ERROR ORIGINAL MSG:",
        err.meta?.driverAdapterError?.cause?.originalMessage || err.message,
      );
      console.log("=========================================");
    }
  });
});
