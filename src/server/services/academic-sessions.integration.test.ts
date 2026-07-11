/* eslint-disable @typescript-eslint/no-explicit-any */

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

vi.mock("@/lib/db", () => ({
  db: testDbProxy,
}));

import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../lib/test/db-isolation";

import { activateSession, createSession } from "./academic-sessions";

// Test isolation gate
let testActor: ActorContext | null = null;

beforeAll(async () => {
  if (!isTestConfigured) return;

  const testDb = await initializeTestDb();
  if (!testDb) return;

  // Clean up any left over state
  await testDb.auditLog.deleteMany({});
  await testDb.teacherAssignment.deleteMany({});
  await testDb.enrolment.deleteMany({});
  await testDb.student.deleteMany({});
  await testDb.studyMaterial.deleteMany({});
  await testDb.homework.deleteMany({});
  await testDb.fileAsset.deleteMany({});
  await testDb.test.deleteMany({});
  await testDb.batchSchedule.deleteMany({});
  await testDb.batch.deleteMany({});
  await testDb.academicSession.deleteMany({});
  await testDb.appUser.deleteMany({});

  // Create test AppUser fixture based on actual Prisma schema
  const appUser = await testDb.appUser.create({
    data: {
      role: "ADMIN",
      status: "ACTIVE",
      email: "test-admin-isolated@test.local",
      supabaseAuthUserId: "00000000-0000-4000-8000-000000000001",
    },
  });

  testActor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };
});

afterAll(async () => {
  const testDb = (globalThis as any).__testDb;
  if (testDb) {
    await testDb.auditLog.deleteMany({});
    await testDb.teacherAssignment.deleteMany({});
    await testDb.enrolment.deleteMany({});
    await testDb.student.deleteMany({});
    await testDb.studyMaterial.deleteMany({});
    await testDb.homework.deleteMany({});
    await testDb.fileAsset.deleteMany({});
    await testDb.test.deleteMany({});
    await testDb.batchSchedule.deleteMany({});
    await testDb.batch.deleteMany({});
    await testDb.academicSession.deleteMany({});
    await testDb.appUser.deleteMany({});
  }
  await teardownTestDb();
});

describe.skipIf(!isTestConfigured)("Academic Session Integration", () => {
  it("enforces zero-or-one active session strictly across concurrent activations", async () => {
    const testDb = (globalThis as any).__testDb;
    if (!testDb || !testActor) {
      throw new Error("Test infrastructure failed to initialize despite gate passing.");
    }

    const s1 = await createSession(testActor, { name: "Integration-1" });
    const s2 = await createSession(testActor, { name: "Integration-2" });
    const s3 = await createSession(testActor, { name: "Integration-3" });

    // Fire 3 concurrent activations targeting different sessions
    const results = await Promise.allSettled([
      activateSession(testActor, s1.id),
      activateSession(testActor, s2.id),
      activateSession(testActor, s3.id),
    ]);

    const activeCount = await testDb.academicSession.count({ where: { isActive: true } });
    const fulfilled = results.filter((r) => r.status === "fulfilled");

    if (fulfilled.length > 0) {
      // If at least one succeeded, exactly one MUST be active
      expect(activeCount).toBe(1);

      // And it must be one of the targets
      const activeSession = await testDb.academicSession.findFirst({
        where: { isActive: true },
      });
      expect([s1.id, s2.id, s3.id]).toContain(activeSession?.id);
    } else {
      expect(activeCount).toBe(0);
    }

    // Verify all failed requests threw the expected concurrent error
    const rejected = results.filter(
      (r) => r.status === "rejected",
    ) as PromiseRejectedResult[];
    rejected.forEach((r) => {
      expect(r.reason.code).toBe("CONCURRENT_UPDATE");
    });
  });
});
