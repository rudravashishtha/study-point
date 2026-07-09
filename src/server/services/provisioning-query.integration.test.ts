import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { listStudentActivationCandidates } from "./provisioning";
import { Role } from "@prisma/client";
import { ActorContext } from "../../lib/domain/actor";

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

vi.mock("../../lib/db", () => ({
  db: testDbProxy,
}));

vi.mock("../../lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_SUPABASE_URL: "https://fake.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fake-anon-key",
  },
  serverEnv: {
    SUPABASE_SECRET_KEY: "fake-secret-key",
  },
}));

const adminActor: ActorContext = {
  userId: "admin-1",
  role: Role.ADMIN,
  metadata: { role: Role.ADMIN, status: "ACTIVE" },
};

import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../lib/test/db-isolation";

describe("listStudentActivationCandidates", () => {
  beforeAll(async () => {
    if (isTestConfigured) await initializeTestDb();
  });

  afterAll(async () => {
    if (isTestConfigured) await teardownTestDb();
  });

  it("excludes students who already have an AppUser linked", async () => {
    if (!isTestConfigured) return;
    const db = testDbProxy as PrismaClient;

    const student1 = await db.student.create({
      data: {
        studentCode: "CAND-1",
        fullName: "Cand One",
        email: "cand1@example.com",
      },
    });

    const student2 = await db.student.create({
      data: {
        studentCode: "CAND-2",
        fullName: "Cand Two",
        email: "cand2@example.com",
      },
    });

    // Manually create an AppUser for student2
    await db.appUser.create({
      data: {
        email: "cand2@example.com",
        role: Role.STUDENT,
        supabaseAuthUserId: "fake-auth-cand2",
        status: "INVITED",
        student: { connect: { id: student2.id } },
      },
    });

    const candidates = await listStudentActivationCandidates(adminActor);

    const candidateIds = candidates.map((c) => c.id);
    expect(candidateIds).toContain(student1.id);
    expect(candidateIds).not.toContain(student2.id);

    // Verify properties
    const s1Candidate = candidates.find((c) => c.id === student1.id)!;
    expect(s1Candidate.email).toBe("cand1@example.com");
    expect(s1Candidate.isEligible).toBe(true);

    // Cleanup
    await db.appUser.deleteMany({ where: { email: "cand2@example.com" } });
    await db.student.deleteMany({ where: { id: { in: [student1.id, student2.id] } } });
  });

  it("includes students without emails but marks them ineligible", async () => {
    if (!isTestConfigured) return;
    const db = testDbProxy as PrismaClient;

    const studentNoEmail = await db.student.create({
      data: {
        studentCode: "NO-EMAIL",
        fullName: "No Email",
      },
    });

    const candidates = await listStudentActivationCandidates(adminActor);
    const candidate = candidates.find((c) => c.id === studentNoEmail.id);

    expect(candidate).toBeDefined();
    expect(candidate!.email).toBeNull();
    expect(candidate!.isEligible).toBe(false);

    await db.student.delete({ where: { id: studentNoEmail.id } });
  });
});
