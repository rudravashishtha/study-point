import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import {
  extractPrismaConstraintName,
  extractPrismaUniqueFields,
  matchUniqueFields,
  isConcurrencyConflict,
} from "./errors";

describe("Database Error Utilities", () => {
  describe("extractPrismaUniqueFields", () => {
    it("returns null for non-Prisma errors", () => {
      expect(extractPrismaUniqueFields(new Error("Generic error"))).toBeNull();
      expect(extractPrismaUniqueFields("String error")).toBeNull();
      expect(extractPrismaUniqueFields(null)).toBeNull();
    });

    it("returns null for non-P2002 Prisma errors", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "1.0",
      });
      expect(extractPrismaUniqueFields(error)).toBeNull();
    });

    it("extracts fields from standard Prisma engine meta.target", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "1.0",
        meta: { target: ["boardId", "code"] },
      });
      expect(extractPrismaUniqueFields(error)).toEqual(["boardId", "code"]);
    });

    it("extracts and strips quotes from @prisma/adapter-pg fields", () => {
      const error = new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "1.0",
        meta: {
          driverAdapterError: {
            cause: {
              constraint: {
                fields: ['"boardId"', '"code"'],
              },
            },
          },
        },
      });
      expect(extractPrismaUniqueFields(error)).toEqual(["boardId", "code"]);
    });

    it("returns null for malformed metadata", () => {
      const error1 = new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "1.0",
        meta: {}, // empty
      });
      expect(extractPrismaUniqueFields(error1)).toBeNull();

      const error2 = new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "1.0",
        meta: { target: "not-an-array" },
      });
      expect(extractPrismaUniqueFields(error2)).toBeNull();
    });
  });

  describe("matchUniqueFields", () => {
    it("matches exact fields order-independently", () => {
      expect(matchUniqueFields(["code", "boardId"], ["boardId", "code"])).toBe(true);
      expect(matchUniqueFields(["code"], ["code"])).toBe(true);
    });

    it("rejects partial or subset matches", () => {
      expect(matchUniqueFields(["code", "boardId"], ["code"])).toBe(false);
      expect(matchUniqueFields(["code"], ["code", "boardId"])).toBe(false);
    });

    it("rejects completely different fields", () => {
      expect(matchUniqueFields(["name"], ["code"])).toBe(false);
    });

    it("handles null actual fields gracefully", () => {
      expect(matchUniqueFields(null, ["code"])).toBe(false);
    });
  });
});

describe("isConcurrencyConflict", () => {
  it("returns true for Prisma P2034", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Transaction failed", {
      code: "P2034",
      clientVersion: "4.0.0",
    });
    expect(isConcurrencyConflict(error)).toBe(true);
  });

  it("returns true for Postgres 40P01 unwrapped error with cause", () => {
    const error = {
      cause: {
        originalCode: "40P01",
        originalMessage: "deadlock detected",
      },
    };
    expect(isConcurrencyConflict(error)).toBe(true);
  });

  it("returns true for Postgres 40P01 with driverAdapterError cause", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Transaction failed", {
      code: "P2010",
      clientVersion: "4.0.0",
      meta: {
        driverAdapterError: {
          cause: {
            originalCode: "40P01",
            originalMessage: "deadlock detected",
          },
        },
      },
    });
    expect(isConcurrencyConflict(error)).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Failed", {
      code: "P2002",
      clientVersion: "4.0.0",
    });
    expect(isConcurrencyConflict(error)).toBe(false);

    expect(isConcurrencyConflict(new Error("Something else"))).toBe(false);
    expect(isConcurrencyConflict(null)).toBe(false);
    expect(isConcurrencyConflict({})).toBe(false);
  });
});
