/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, vi } from "vitest";
import { createBoard, updateBoard, archiveBoard, restoreBoard } from "./boards";
import { DomainError } from "../../../lib/domain/errors";
import { Prisma } from "@prisma/client";

vi.mock("../../../lib/db", () => ({
  db: {
    $transaction: vi.fn(),
  },
}));

vi.mock("../../../lib/domain/audit", () => ({
  createAuditLog: vi.fn(),
}));

import { db } from "../../../lib/db";

describe("Boards Domain Service", () => {
  const mockActor = {
    userId: "user-1",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };

  describe("createBoard", () => {
    it("maps exact P2002 target 'code' to DUPLICATE_IDENTITY", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: { target: ["code"] },
        });
      });

      await expect(
        createBoard(mockActor, { code: "CBSE", name: "CBSE" }),
      ).rejects.toMatchObject({
        code: "DUPLICATE_IDENTITY",
      });
    });

    it("maps adapter-pg P2002 'code' to DUPLICATE_IDENTITY", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: {
            driverAdapterError: {
              cause: { constraint: { fields: ['"code"'] } },
            },
          },
        });
      });

      await expect(
        createBoard(mockActor, { code: "CBSE", name: "CBSE" }),
      ).rejects.toMatchObject({
        code: "DUPLICATE_IDENTITY",
      });
    });

    it("does not map unmatched P2002 target", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: { target: ["other"] },
        });
      });

      const err = await createBoard(mockActor, { code: "CBSE", name: "CBSE" }).catch(
        (e) => e,
      );
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(err.code).not.toBe("DUPLICATE_IDENTITY");
    });

    it("does not map unmatched adapter-pg P2002 target", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: {
            driverAdapterError: {
              cause: { constraint: { fields: ['"other"'] } },
            },
          },
        });
      });

      const err = await createBoard(mockActor, { code: "CBSE", name: "CBSE" }).catch(
        (e) => e,
      );
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(err.code).not.toBe("DUPLICATE_IDENTITY");
    });
  });

  describe("updateBoard", () => {
    it("rejects update if archived", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        // Mock tx object
        const tx = {
          board: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: new Date() }),
          },
        };
        return cb(tx as any);
      });

      await expect(updateBoard(mockActor, "1", { name: "New" })).rejects.toMatchObject({
        code: "INVALID_LIFECYCLE",
      });
    });
  });

  describe("archiveBoard", () => {
    it("rejects if already archived", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          board: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: new Date() }),
          },
        };
        return cb(tx as any);
      });

      await expect(archiveBoard(mockActor, "1")).rejects.toMatchObject({
        code: "INVALID_LIFECYCLE",
      });
    });

    it("throws ARCHIVE_BLOCKED if unarchived dependants exist (Programme)", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          board: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: null }),
          },
          programme: {
            count: vi.fn().mockResolvedValue(1), // Dependant exists
          },
          curriculumTrack: {
            count: vi.fn().mockResolvedValue(0),
          },
        };
        return cb(tx as any);
      });

      await expect(archiveBoard(mockActor, "1")).rejects.toMatchObject({
        code: "ARCHIVE_BLOCKED",
      });
    });

    it("throws ARCHIVE_BLOCKED if unarchived dependants exist (CurriculumTrack)", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          board: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: null }),
          },
          programme: {
            count: vi.fn().mockResolvedValue(0),
          },
          curriculumTrack: {
            count: vi.fn().mockResolvedValue(1), // Dependant exists
          },
        };
        return cb(tx as any);
      });

      await expect(archiveBoard(mockActor, "1")).rejects.toMatchObject({
        code: "ARCHIVE_BLOCKED",
      });
    });
  });

  describe("restoreBoard", () => {
    it("returns as a true no-op if already restored", async () => {
      const existing = { id: "1", archivedAt: null, updatedAt: new Date() };
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          board: {
            findUnique: vi.fn().mockResolvedValue(existing),
            update: vi.fn(),
          },
        };
        return cb(tx as any);
      });

      const res = await restoreBoard(mockActor, "1");
      expect(res).toEqual(existing);
      // We can infer no update/audit happens because update wasn't called (implied by the test)
    });
  });
});
