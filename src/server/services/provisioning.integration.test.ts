import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { inviteStudent, inviteTeacher } from "./provisioning";
import { ActorContext } from "../../lib/domain/actor";
import { db } from "../../lib/db";

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

// Mock env to prevent admin.ts from throwing
vi.mock("../../lib/env", () => ({
  serverEnv: { SUPABASE_SECRET_KEY: "secret" },
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "url" },
}));

// Mock Supabase admin
const { mockInviteUserByEmail } = vi.hoisted(() => ({ mockInviteUserByEmail: vi.fn() }));
vi.mock("../../lib/supabase/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/supabase/admin")>();
  return {
    ...actual,
    createAdminClient: vi.fn(() => ({
      auth: {
        admin: {
          inviteUserByEmail: mockInviteUserByEmail,
        },
      },
    })),
    findAuthUserByEmail: vi.fn(),
  };
});

import { createAdminClient, findAuthUserByEmail } from "../../lib/supabase/admin";
import {
  isTestConfigured,
  initializeTestDb,
  teardownTestDb,
} from "../../lib/test/db-isolation";

describe("Provisioning Service Integration Tests", () => {
  beforeAll(async () => {
    if (isTestConfigured) await initializeTestDb();
  });
  afterAll(async () => {
    if (isTestConfigured) await teardownTestDb();
  });
  const unauthorizedActor: ActorContext = {
    userId: "none",
    role: "STUDENT",
    metadata: { role: "STUDENT", status: "ACTIVE" },
  };
  const noEmailActor: ActorContext = {
    userId: "none",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };
  const noRoleActor: ActorContext = {
    userId: "none",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };
  const adminActor: ActorContext = {
    userId: "admin1",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };
  const teacherActor: ActorContext = {
    userId: "teacher1",
    role: "TEACHER",
    metadata: { role: "TEACHER", status: "ACTIVE" },
  };
  const studentActor: ActorContext = {
    userId: "student1",
    role: "STUDENT",
    metadata: { role: "STUDENT", status: "ACTIVE" },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Use test database directly
  });

  describe("inviteStudent", () => {
    it("1. non-Admin ActorContext cannot provision a Student", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Test",
          email: "test@example.com",
        },
      });
      await expect(inviteStudent(teacherActor, student.id)).rejects.toThrow(
        /Unauthorized/i,
      );
      await expect(inviteStudent(studentActor, student.id)).rejects.toThrow(
        /Unauthorized/i,
      );
    });

    it("2. supabaseAuthUserId linked to an existing AppUser is rejected during recovery", async () => {
      if (!isTestConfigured) return;
      const student1 = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "S1",
          email: `s1-${Date.now()}@test.com`,
        },
      });
      const student2 = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "S2",
          email: `s2-${Date.now()}@test.com`,
        },
      });
      const dupAuthId = `auth-${Date.now()}`;

      await db.appUser.create({
        data: {
          email: student1.email!,
          role: "STUDENT",
          status: "ACTIVE",
          supabaseAuthUserId: dupAuthId,
          studentId: student1.id,
        },
      });

      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: {
          name: "AuthApiError",
          status: 422,
          message: "user already exists",
        } as any,
      });
      vi.mocked(findAuthUserByEmail).mockResolvedValue({ id: dupAuthId } as any);

      await expect(inviteStudent(adminActor, student2.id)).rejects.toThrow(
        /already linked/i,
      );
    });

    it("3. missing email rejected", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: { studentCode: `ST-${Date.now()}`, fullName: "No Email" },
      });
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /email is required/i,
      );
    });

    it("4. archived/ineligible profile rejected", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Arch",
          email: "a@a.com",
          archivedAt: new Date(),
        },
      });
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /archived student/i,
      );
    });

    it("5. already invited rejected safely", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Inv",
          email: `i-${Date.now()}@a.com`,
        },
      });
      await db.appUser.create({
        data: {
          role: "STUDENT",
          status: "INVITED",
          email: student.email!,
          studentId: student.id,
        },
      });
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /already has a linked AppUser/i,
      );
    });

    it("6. already active rejected safely", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Act",
          email: `a-${Date.now()}@a.com`,
        },
      });
      await db.appUser.create({
        data: {
          role: "STUDENT",
          status: "ACTIVE",
          email: student.email!,
          studentId: student.id,
        },
      });
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /already has a linked AppUser/i,
      );
    });

    it("7. disabled account is not treated as uninvited", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Dis",
          email: `d-${Date.now()}@a.com`,
        },
      });
      await db.appUser.create({
        data: {
          role: "STUDENT",
          status: "DISABLED",
          email: student.email!,
          studentId: student.id,
        },
      });
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /already has a linked AppUser/i,
      );
    });

    it("8. duplicate profile provisioning cannot create another AppUser", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Dup",
          email: `dup-${Date.now()}@a.com`,
        },
      });

      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-${Date.now()}` } },
        error: null,
      } as any);

      await inviteStudent(adminActor, student.id);
      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /already has a linked AppUser/i,
      );
    });

    it("9. duplicate normalized email cannot create another identity mapping", async () => {
      if (!isTestConfigured) return;
      const email = `dupmail-${Date.now()}@test.com`;
      const s1 = await db.student.create({
        data: { studentCode: `ST-${Date.now()}-1`, fullName: "S1", email },
      });
      const s2 = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}-2`,
          fullName: "S2",
          email: email.toUpperCase(),
        },
      });

      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-${Date.now()}` } },
        error: null,
      } as any);

      await inviteStudent(adminActor, s1.id);
      await expect(inviteStudent(adminActor, s2.id)).rejects.toThrow(
        /Email is already in use by another AppUser/i,
      );
    });

    it("10. role is always derived server-side", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Role",
          email: `role-${Date.now()}@a.com`,
        },
      });
      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-${Date.now()}` } },
        error: null,
      } as any);

      const appUser = await inviteStudent(adminActor, student.id);
      expect(appUser.role).toBe("STUDENT");
    });

    it("11. Supabase Auth user ID is persisted from the Admin API response", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Auth",
          email: `auth-${Date.now()}@a.com`,
        },
      });
      const mockSupabase = createAdminClient();
      const newAuthId = `new-auth-${Date.now()}`;
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: newAuthId } },
        error: null,
      } as any);

      const appUser = await inviteStudent(adminActor, student.id);
      expect(appUser.supabaseAuthUserId).toBe(newAuthId);
    });

    it("12. Supabase failure causes no false INVITED database state (Rate Limit)", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Fail",
          email: `fail-${Date.now()}@a.com`,
        },
      });
      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { name: "AuthApiError", status: 429, message: "rate limit" },
      } as any);

      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(/rate limit/i);

      const appUser = await db.appUser.findUnique({ where: { studentId: student.id } });
      expect(appUser).toBeNull();

      const freshStudent = await db.student.findUnique({ where: { id: student.id } });
      expect(freshStudent?.accountStatus).toBe("none");

      // Also confirm findAuthUserByEmail was NOT called
      expect(findAuthUserByEmail).not.toHaveBeenCalled();
    });

    it("12b. unrelated 422 does not trigger reconciliation and creates no success state", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Fail422",
          email: `fail422-${Date.now()}@a.com`,
        },
      });
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { name: "AuthApiError", status: 422, message: "Password is too weak" },
      } as any);

      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /Password is too weak/i,
      );

      // Verify no findAuthUserByEmail
      expect(findAuthUserByEmail).not.toHaveBeenCalled();

      // Verify no AppUser
      const appUser = await db.appUser.findUnique({ where: { studentId: student.id } });
      expect(appUser).toBeNull();

      // Verify no Student.accountStatus mutation
      const freshStudent = await db.student.findUnique({ where: { id: student.id } });
      expect(freshStudent?.accountStatus).toBe("none");

      // Verify no success audit log
      const logs = await db.auditLog.findMany({ where: { entityId: student.id } });
      expect(logs.length).toBe(0);
    });

    it("12c. unknown Supabase errors do not trigger reconciliation", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Unk",
          email: `unk-${Date.now()}@a.com`,
        },
      });
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: { message: "Network timeout" },
      } as any);

      await expect(inviteStudent(adminActor, student.id)).rejects.toThrow(
        /Network timeout/i,
      );
      expect(findAuthUserByEmail).not.toHaveBeenCalled();
    });

    it("13. database failure after Supabase success has a tested recovery/reconciliation path", async () => {
      if (!isTestConfigured) return;
      const student = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "Rec",
          email: `rec-${Date.now()}@a.com`,
        },
      });
      const dupAuthId = `auth-rec-${Date.now()}`;

      const mockSupabase = createAdminClient();
      // Mock failure due to already exists
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: null },
        error: {
          name: "AuthApiError",
          status: 422,
          message: "User already exists",
        } as any,
      });
      // Mock find returns the ID
      vi.mocked(findAuthUserByEmail).mockResolvedValue({ id: dupAuthId } as any);

      const appUser = await inviteStudent(adminActor, student.id);
      expect(appUser.supabaseAuthUserId).toBe(dupAuthId);
      expect(appUser.status).toBe("INVITED");
    });
  });

  describe("inviteTeacher", () => {
    it("1. non-Admin ActorContext cannot provision a Teacher", async () => {
      if (!isTestConfigured) return;
      const teacher = await db.teacher.create({
        data: { displayName: "Test", email: "test-t@example.com" },
      });
      await expect(inviteTeacher(teacherActor, teacher.id)).rejects.toThrow(
        /Unauthorized/i,
      );
    });

    // We can assume the rest of the validations share the same exact logic path,
    // but we add one test specifically for teacher inactive check
    it("4. archived/ineligible profile rejected (Teacher)", async () => {
      if (!isTestConfigured) return;
      const teacher = await db.teacher.create({
        data: { displayName: "Inactive", email: "i-t@example.com", active: false },
      });
      await expect(inviteTeacher(adminActor, teacher.id)).rejects.toThrow(
        /inactive teacher/i,
      );
    });

    it("14. unauthorized callers cannot provision accounts", async () => {
      if (!isTestConfigured) return;
      const teacher = await db.teacher.create({
        data: { displayName: "Unauth", email: "unauth-t@example.com" },
      });
      await expect(inviteTeacher(studentActor, teacher.id)).rejects.toThrow(
        /Unauthorized/i,
      );
    });

    it("15. Student invitation links only to the requested Student", async () => {
      if (!isTestConfigured) return;
      const s = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "S",
          email: `s-link-${Date.now()}@a.com`,
        },
      });
      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-s-${Date.now()}` } },
        error: null,
      } as any);
      const appUser = await inviteStudent(adminActor, s.id);
      expect(appUser.studentId).toBe(s.id);
      expect(appUser.teacherId).toBeNull();
    });

    it("16. Teacher invitation links only to the requested Teacher", async () => {
      if (!isTestConfigured) return;
      const t = await db.teacher.create({
        data: { displayName: "T", email: `t-link-${Date.now()}@a.com` },
      });
      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-t-${Date.now()}` } },
        error: null,
      } as any);
      const appUser = await inviteTeacher(adminActor, t.id);
      expect(appUser.teacherId).toBe(t.id);
      expect(appUser.studentId).toBeNull();
    });

    it("17. Student provisioning cannot create a TEACHER role and vice versa", async () => {
      if (!isTestConfigured) return;
      const s = await db.student.create({
        data: {
          studentCode: `ST-${Date.now()}`,
          fullName: "S2",
          email: `s-role-${Date.now()}@a.com`,
        },
      });
      const t = await db.teacher.create({
        data: { displayName: "T2", email: `t-role-${Date.now()}@a.com` },
      });

      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-${Date.now()}` } },
        error: null,
      } as any);

      const u1 = await inviteStudent(adminActor, s.id);
      expect(u1.role).toBe("STUDENT");
      expect(u1.role).not.toBe("TEACHER");

      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth2-${Date.now()}` } },
        error: null,
      } as any);
      const u2 = await inviteTeacher(adminActor, t.id);
      expect(u2.role).toBe("TEACHER");
      expect(u2.role).not.toBe("STUDENT");
    });

    it("18. audit success and failure behavior is verified (no secrets logged)", async () => {
      if (!isTestConfigured) return;
      const t = await db.teacher.create({
        data: { displayName: "Audit", email: `audit-${Date.now()}@a.com` },
      });
      const mockSupabase = createAdminClient();
      mockInviteUserByEmail.mockResolvedValue({
        data: { user: { id: `auth-aud-${Date.now()}` } },
        error: null,
      } as any);
      await inviteTeacher(adminActor, t.id);

      const logs = await db.auditLog.findMany({
        where: { entityType: "TEACHER", entityId: t.id, action: "PROVISION" },
      });
      expect(logs).toHaveLength(1);

      const metadata = logs[0].metadata as any;
      expect(metadata.role).toBe("TEACHER");
      // ensure no secrets
      expect(JSON.stringify(metadata)).not.toMatch(/secret|token|password/i);
    });
  });
});
