import { describe, it, expect, vi } from "vitest";
import { activateSession, createSession } from "./academic-sessions";
import { DomainError } from "../../lib/domain/errors";
import { Prisma } from "@prisma/client";

// Mock dependencies
vi.mock("../../lib/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/domain/audit", () => ({
  createAuditLog: vi.fn(),
}));

import { db } from "../../lib/db";

describe("Academic Sessions Domain Service", () => {
  const mockActor = {
    userId: "user-1",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };

  describe("activateSession (Retry Logic)", () => {
    it("retries on P2034 and succeeds eventually", async () => {
      let attempts = 0;
      vi.mocked(db.$transaction).mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Prisma.PrismaClientKnownRequestError("Serialization failure", {
            code: "P2034",
            clientVersion: "5",
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { id: "session-1", isActive: true } as any;
      });

      const result = await activateSession(mockActor, "session-1");
      expect(attempts).toBe(3);
      expect(result.isActive).toBe(true);
    });

    it("throws CONCURRENT_UPDATE if P2034 happens 3 times", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Serialization failure", {
          code: "P2034",
          clientVersion: "5",
        });
      });

      await expect(activateSession(mockActor, "session-1")).rejects.toThrow(DomainError);
      await expect(activateSession(mockActor, "session-1")).rejects.toMatchObject({
        code: "CONCURRENT_UPDATE",
      });
    });

    it("throws immediately on other Prisma errors without retrying", async () => {
      let attempts = 0;
      vi.mocked(db.$transaction).mockImplementation(async () => {
        attempts++;
        throw new Prisma.PrismaClientKnownRequestError("Other error", {
          code: "P2002",
          clientVersion: "5",
        });
      });

      await expect(activateSession(mockActor, "session-1")).rejects.toThrow();
      expect(attempts).toBe(1); // No retries
    });
  });

  describe("createSession (P2002 Mapping)", () => {
    it("maps P2002 to DUPLICATE_IDENTITY", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "5",
          meta: { target: ["name"] },
        });
      });

      await expect(createSession(mockActor, { name: "Test" })).rejects.toThrow(
        DomainError,
      );
      await expect(createSession(mockActor, { name: "Test" })).rejects.toMatchObject({
        code: "DUPLICATE_IDENTITY",
      });
    });
  });
});
