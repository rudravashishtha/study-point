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
      get(target, prop) {
        if (!(globalThis as any).__testDb) throw new Error("testDb is not initialized");
        return ((globalThis as any).__testDb as any)[prop];
      },
    }),
  };
});

vi.mock("../../../lib/db", () => ({ db: testDbProxy }));

import { createChapter, moveChapter, listChapters } from "./chapters";
import { db } from "../../../lib/db";

describe.skipIf(!isTestConfigured)("Chapters Service (Integration)", () => {
  let testActor: ActorContext | null = null;
  let testTrack: any;

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
      metadata: { role: appUser.role, status: "active" },
    };

    const board = await testDb.board.create({ data: { code: "B", name: "B" } });
    const subject = await testDb.subject.create({ data: { code: "S", name: "S" } });
    testTrack = await testDb.curriculumTrack.create({
      data: {
        boardId: board.id,
        subjectId: subject.id,
        classLevel: "IX",
        displayName: "T",
      },
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
      await testDb.chapter.deleteMany();
    }
  });

  it("handles concurrent chapter reordering safely", async () => {
    const c1 = await createChapter(testActor!, {
      curriculumTrackId: testTrack.id,
      name: "C1",
    });
    const c2 = await createChapter(testActor!, {
      curriculumTrackId: testTrack.id,
      name: "C2",
    });
    const c3 = await createChapter(testActor!, {
      curriculumTrackId: testTrack.id,
      name: "C3",
    });
    const c4 = await createChapter(testActor!, {
      curriculumTrackId: testTrack.id,
      name: "C4",
    });

    const initialState = [c1.id, c2.id, c3.id, c4.id];

    const testDb = (globalThis as any).__testDb as PrismaClient;
    await testDb.auditLog.deleteMany({});

    const operations: { id: string; direction: "UP" | "DOWN" }[] = [
      { id: c4.id, direction: "UP" },
      { id: c1.id, direction: "DOWN" },
      { id: c2.id, direction: "UP" },
    ];

    const promises = operations.map((op) =>
      moveChapter(testActor!, testTrack.id, op.id, op.direction),
    );
    const results = await Promise.allSettled(promises);

    const fulfilledOps = operations.filter((_, i) => results[i].status === "fulfilled");
    const rejectedResults = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];

    for (const r of rejectedResults) {
      console.log("REJECTION REASON:", r.reason);
      expect(r.reason.code).toBe("CONCURRENT_UPDATE");
    }

    const finalChapters = await listChapters(testTrack.id, { archiveState: "active" });
    expect(finalChapters).toHaveLength(4);

    // Check against valid serial histories
    const getPermutations = (arr: any[]): any[][] => {
      if (arr.length <= 1) return [arr];
      const perms: any[][] = [];
      for (let i = 0; i < arr.length; i++) {
        const rest = getPermutations(arr.slice(0, i).concat(arr.slice(i + 1)));
        for (const p of rest) perms.push([arr[i], ...p]);
      }
      return perms;
    };

    const applyOps = (startState: string[], ops: typeof operations) => {
      let state = [...startState];
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

    const actualFinalState = finalChapters.map((c) => c.id);
    const moveAudits = await testDb.auditLog.findMany({ where: { action: "REORDER" } });

    const matchingHistory = possibleHistories.find((h) => {
      const matchesState = h.state.every((id, idx) => id === actualFinalState[idx]);

      const matchesAuditCount = moveAudits.length === h.auditCount;
      const matchesAuditDetails = h.expectedAudits.every((expectedAudit) => {
        return moveAudits.some(
          (a) =>
            a.entityId === expectedAudit.entityId &&
            (a.metadata as any).swappedWithId === expectedAudit.swappedWithId &&
            (a.metadata as any).previousOrder === expectedAudit.previousOrder &&
            (a.metadata as any).newOrder === expectedAudit.newOrder,
        );
      });

      return matchesState && matchesAuditCount && matchesAuditDetails;
    });

    expect(matchingHistory).toBeDefined();
  });
});
