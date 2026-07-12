import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { ActorContext } from "../../../lib/domain/actor";
import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../../lib/test/db-isolation";

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

vi.mock("../../../lib/db", () => ({ db: testDbProxy }));

import { createTopic, moveTopic, listTopics } from "./topics";

describe.skipIf(!isTestConfigured)("Topics Service (Integration)", () => {
  let testActor: ActorContext | null = null;
  let testChapter: Awaited<ReturnType<PrismaClient["chapter"]["create"]>>;

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
    await testDb.test.deleteMany({});
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
      metadata: { role: appUser.role, status: "active" },
    };

    const board = await testDb.board.create({ data: { code: "BT", name: "BT" } });
    const subject = await testDb.subject.create({ data: { code: "ST", name: "ST" } });
    const track = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "IX",
        displayName: "TT",
      },
    });
    testChapter = await testDb.chapter.create({
      data: {
        curriculumTrackId: track.id,
        name: "C1",
      },
    });
  });

  afterAll(async () => {
    const testDb = (globalThis as Record<string, unknown>)
      .__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.auditLog.deleteMany({});
      await testDb.topic.deleteMany({});
      await testDb.chapter.deleteMany({});
      await testDb.enrolment.deleteMany({});
      await testDb.batchSchedule.deleteMany({});
      await testDb.homework.deleteMany({});
      await testDb.teacherAssignment.deleteMany({});
      await testDb.test.deleteMany({});
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
    const testDb = (globalThis as Record<string, unknown>)
      .__testDb as PrismaClient | null;
    if (testDb) {
      await testDb.auditLog.deleteMany();
      await testDb.topic.deleteMany();
    }
  });

  it("handles concurrent topic reordering safely", async () => {
    const t1 = await createTopic(testActor!, { chapterId: testChapter.id, name: "T1" });
    const t2 = await createTopic(testActor!, { chapterId: testChapter.id, name: "T2" });
    const t3 = await createTopic(testActor!, { chapterId: testChapter.id, name: "T3" });

    const initialState = [t1.id, t2.id, t3.id];

    const testDb = (globalThis as Record<string, unknown>).__testDb as PrismaClient;
    await testDb.auditLog.deleteMany({});

    const operations: { id: string; direction: "UP" | "DOWN" }[] = [
      { id: t3.id, direction: "UP" },
      { id: t1.id, direction: "DOWN" },
      { id: t2.id, direction: "UP" },
    ];

    const promises = operations.map((op) =>
      moveTopic(
        testActor!,
        testChapter.curriculumTrackId,
        testChapter.id,
        op.id,
        op.direction,
      ),
    );
    const results = await Promise.allSettled(promises);

    const fulfilledOps = operations.filter((_, i) => results[i].status === "fulfilled");
    const rejectedResults = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];

    for (const r of rejectedResults) {
      expect(r.reason.code).toBe("CONCURRENT_UPDATE");
    }

    const finalTopics = await listTopics(testChapter.id, { archiveState: "active" });
    expect(finalTopics).toHaveLength(3);

    // Check against valid serial histories
    const getPermutations = <T>(arr: T[]): T[][] => {
      if (arr.length <= 1) return [arr];
      const perms: T[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = getPermutations(arr.slice(0, i).concat(arr.slice(i + 1)));
        for (const p of rest) perms.push([arr[i], ...p]);
      }
      return perms;
    };

    const applyOps = (startState: string[], ops: typeof operations) => {
      const state = [...startState];
      let auditCount = 0;
      const expectedAudits: {
        entityId: string;
        swappedWithId: string;
        previousOrder: number;
        newOrder: number;
      }[] = [];

      for (const op of ops) {
        const currentIndex = state.indexOf(op.id);
        if (currentIndex === -1) continue;

        let otherIndex = -1;
        if (op.direction === "UP" && currentIndex > 0) {
          otherIndex = currentIndex - 1;
        } else if (op.direction === "DOWN" && currentIndex < state.length - 1) {
          otherIndex = currentIndex + 1;
        }

        if (otherIndex !== -1) {
          const otherId = state[otherIndex];
          state[currentIndex] = otherId;
          state[otherIndex] = op.id;
          auditCount++;
          expectedAudits.push({
            entityId: op.id,
            swappedWithId: otherId,
            previousOrder: currentIndex,
            newOrder: otherIndex,
          });
        }
      }
      return { state, auditCount, expectedAudits };
    };

    const possibleHistories = getPermutations(fulfilledOps).map((ops) =>
      applyOps(initialState, ops),
    );

    const actualFinalState = finalTopics.map((t) => t.id);
    const moveAudits = await testDb.auditLog.findMany({ where: { action: "REORDER" } });

    const matchingHistory = possibleHistories.find((h) => {
      const matchesState = h.state.every((id, idx) => id === actualFinalState[idx]);

      const matchesAuditCount = moveAudits.length === h.auditCount;
      const matchesAuditDetails = h.expectedAudits.every((expectedAudit) => {
        return moveAudits.some(
          (a) =>
            a.entityId === expectedAudit.entityId &&
            (a.metadata as Record<string, unknown>).swappedWithId ===
              expectedAudit.swappedWithId &&
            (a.metadata as Record<string, unknown>).previousOrder ===
              expectedAudit.previousOrder &&
            (a.metadata as Record<string, unknown>).newOrder === expectedAudit.newOrder,
        );
      });

      return matchesState && matchesAuditCount && matchesAuditDetails;
    });

    expect(matchingHistory).toBeDefined();
  }, 15000);
});
