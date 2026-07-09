import { describe, it, expect, vi, beforeEach } from "vitest";
import { findAuthUserByEmail, isExistingSupabaseUserConflict } from "./admin";

const mockListUsers = vi.fn();

vi.mock("./env", () => ({
  serverEnv: { SUPABASE_SECRET_KEY: "secret" },
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "url" },
}));

vi.mock("../../lib/env", () => ({
  serverEnv: { SUPABASE_SECRET_KEY: "secret" },
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "url" },
}));

vi.mock("@supabase/supabase-js", () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        admin: {
          listUsers: mockListUsers,
        },
      },
    })),
  };
});

describe("Admin Supabase Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isExistingSupabaseUserConflict", () => {
    it("1. recognizes AuthApiError with 422 and already registered", () => {
      expect(
        isExistingSupabaseUserConflict({
          name: "AuthApiError",
          status: 422,
          message: "User already registered",
        }),
      ).toBe(true);
    });

    it("2. recognizes AuthApiError with already exists", () => {
      expect(
        isExistingSupabaseUserConflict({
          name: "AuthApiError",
          status: 400,
          message: "user already exists",
        }),
      ).toBe(true);
    });

    it("3. recognizes generic 422 with already exists", () => {
      expect(
        isExistingSupabaseUserConflict({
          status: 422,
          message: "user_already_exists",
        }),
      ).toBe(true);
    });

    it("4. rejects unrelated 422 (validation error)", () => {
      expect(
        isExistingSupabaseUserConflict({
          name: "AuthApiError",
          status: 422,
          message: "Password is too weak",
        }),
      ).toBe(false);
    });

    it("5. rejects rate limits", () => {
      expect(
        isExistingSupabaseUserConflict({
          name: "AuthApiError",
          status: 429,
          message: "Rate limit exceeded",
        }),
      ).toBe(false);
    });

    it("6. rejects unknown errors", () => {
      expect(isExistingSupabaseUserConflict(new Error("Network error"))).toBe(false);
      expect(isExistingSupabaseUserConflict(null)).toBe(false);
      expect(isExistingSupabaseUserConflict(undefined)).toBe(false);
    });
  });

  describe("findAuthUserByEmail", () => {
    it("performs an exact normalized email match and paginates", async () => {
      mockListUsers.mockResolvedValueOnce({
        data: {
          users: Array.from({ length: 100 }, (_, i) => ({
            email: `not-it-${i}@test.com`,
            id: `id-${i}`,
          })),
        },
        error: null,
      });

      mockListUsers.mockResolvedValueOnce({
        data: {
          users: [
            { email: "almost-target@test.com", id: "id-almost" },
            { email: " Target@Test.com ", id: "id-target" }, // Exact match after normalization
            { email: "target@test.com.au", id: "id-wrong" },
          ],
        },
        error: null,
      });

      const user = await findAuthUserByEmail("target@test.com");
      expect(user).not.toBeNull();
      expect(user?.id).toBe("id-target");
      expect(mockListUsers).toHaveBeenCalledTimes(2);
    });

    it("returns null if no exact match found", async () => {
      mockListUsers.mockResolvedValueOnce({
        data: {
          users: [{ email: "almost-target@test.com", id: "id-almost" }],
        },
        error: null,
      });

      const user = await findAuthUserByEmail("target@test.com");
      expect(user).toBeNull();
    });
  });
});
