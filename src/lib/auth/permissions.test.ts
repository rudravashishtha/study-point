import { describe, it, expect, vi } from "vitest";
import { requireAuth, requireAppUser, requireRole, requireAdmin } from "./permissions";
import { Role, AppUserStatus } from "@prisma/client";

// We need to mock the dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: {
    appUser: {
      findUnique: vi.fn(),
    },
  },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url) => {
    throw new Error(`Redirected to ${url}`);
  }),
}));

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

describe("Permission Helpers", () => {
  it("requireAuth throws redirect if no user", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as unknown as never);

    await expect(requireAuth()).rejects.toThrow("Redirected to /login");
  });

  it("requireAuth returns user if authenticated", async () => {
    const mockUser = { id: "supabase-123" };
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    } as unknown as never);

    const result = await requireAuth();
    expect(result).toEqual(mockUser);
  });

  it("requireAppUser throws redirect if no AppUser or not ACTIVE", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "supabase-123" } }, error: null }),
      },
    } as unknown as never);

    vi.mocked(db.appUser.findUnique).mockResolvedValue(null);
    await expect(requireAppUser()).rejects.toThrow("Redirected to /login");

    vi.mocked(db.appUser.findUnique).mockResolvedValue({
      status: AppUserStatus.DISABLED,
    } as unknown as never);
    await expect(requireAppUser()).rejects.toThrow("Redirected to /login");
  });

  it("requireAppUser returns AppUser if ACTIVE", async () => {
    const mockAppUser = { id: "app-user-1", status: AppUserStatus.ACTIVE };
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: "supabase-123" } }, error: null }),
      },
    } as unknown as never);
    vi.mocked(db.appUser.findUnique).mockResolvedValue(mockAppUser as unknown as never);

    const result = await requireAppUser();
    expect(result).toEqual(mockAppUser);
  });

  it("requireRole throws redirect if role mismatch", async () => {
    const mockAppUser = {
      id: "app-user-1",
      status: AppUserStatus.ACTIVE,
      role: Role.STUDENT,
    };
    vi.mocked(db.appUser.findUnique).mockResolvedValue(mockAppUser as unknown as never);

    await expect(requireRole(Role.ADMIN)).rejects.toThrow("Redirected to /unauthorized");
  });

  it("requireAdmin succeeds if user is ADMIN", async () => {
    const mockAppUser = {
      id: "app-user-1",
      status: AppUserStatus.ACTIVE,
      role: Role.ADMIN,
    };
    vi.mocked(db.appUser.findUnique).mockResolvedValue(mockAppUser as unknown as never);

    const result = await requireAdmin();
    expect(result).toEqual(mockAppUser);
  });
});
