import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

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
  initializeTestDb,
  teardownTestDb,
  isTestConfigured,
} from "@/lib/test/db-isolation";
import { getSiteSettings, updateSiteSettings } from "./site-settings";
import { ActorContext } from "@/lib/domain/actor";

const prisma = testDbProxy as PrismaClient;

describe.skipIf(!isTestConfigured)("SiteSettings Service", () => {
  let adminActor: ActorContext;

  beforeAll(async () => {
    await initializeTestDb();
    const db = testDbProxy as PrismaClient;
    await db.siteSettings.deleteMany();

    const admin = await db.appUser.create({
      data: { role: "ADMIN", status: "ACTIVE" },
    });
    adminActor = {
      userId: admin.id,
      role: "ADMIN",
      metadata: { role: "ADMIN", status: "ACTIVE" },
    };
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it("1. creates singleton on first getSiteSettings call", async () => {
    const result = await getSiteSettings();
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.instituteName).toBe("Study Point");
    expect(result.data.tagline).toBe("Excellence in Mathematics");
    expect(result.data.heroHeadline).toBe("Mathematics Coaching for Classes IX–XII");
  });

  it("2. returns same singleton on subsequent calls", async () => {
    const result1 = await getSiteSettings();
    const result2 = await getSiteSettings();
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    if (!result1.success || !result2.success) return;
    expect(result1.data.id).toBe(result2.data.id);
  });

  it("3. updates settings with valid input", async () => {
    const result = await updateSiteSettings(adminActor, {
      instituteName: "New Institute Name",
      phone: "+91 9876543210",
      whatsappNumber: "+91 9876543210",
      email: "info@newinstitute.com",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.instituteName).toBe("New Institute Name");
    expect(result.data.phone).toBe("+91 9876543210");
    expect(result.data.whatsappNumber).toBe("+91 9876543210");
    expect(result.data.email).toBe("info@newinstitute.com");
  });

  it("4. partial update preserves other fields", async () => {
    const result = await updateSiteSettings(adminActor, {
      tagline: "Updated Tagline",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.tagline).toBe("Updated Tagline");
    expect(result.data.instituteName).toBe("New Institute Name");
  });

  it("5. clears optional field when explicitly set to null", async () => {
    const result = await updateSiteSettings(adminActor, {
      tagline: null,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.tagline).toBeNull();
  });

  it("6. no-op when no valid fields provided", async () => {
    const before = await getSiteSettings();
    if (!before.success) return;
    const result = await updateSiteSettings(adminActor, {});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.id).toBe(before.data.id);
  });

  it("7. rejects non-admin actor", async () => {
    const studentActor: ActorContext = {
      userId: "student-id",
      role: "STUDENT",
      metadata: { role: "STUDENT", status: "ACTIVE" },
    };
    const result = await updateSiteSettings(studentActor, { instituteName: "Hack" });
    expect(result.success).toBe(false);
  });

  it("8. audit log created on update", async () => {
    const auditBefore = await prisma.auditLog.count({
      where: { entityType: "SiteSettings", action: "SITE_SETTINGS_UPDATE" },
    });

    await updateSiteSettings(adminActor, { instituteName: "Audit Test" });

    const auditAfter = await prisma.auditLog.count({
      where: { entityType: "SiteSettings", action: "SITE_SETTINGS_UPDATE" },
    });
    expect(auditAfter).toBe(auditBefore + 1);
  });
});
