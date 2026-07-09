/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { describe, it, expect, vi } from "vitest";
import {
  createProgramme,
  updateProgramme,
  archiveProgramme,
  restoreProgramme,
} from "./programmes";
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

describe("Programmes Domain Service", () => {
  const mockActor = {
    userId: "user-1",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "ACTIVE" },
  };

  describe("createProgramme", () => {
    it("maps exact P2002 compound target to DUPLICATE_IDENTITY", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: { target: ["boardId", "code"] },
        });
      });

      await expect(
        createProgramme(mockActor, { boardId: "1", code: "ICSE", name: "ICSE" }),
      ).rejects.toMatchObject({
        code: "DUPLICATE_IDENTITY",
      });
    });

    it("maps adapter-pg P2002 compound target to DUPLICATE_IDENTITY", async () => {
      vi.mocked(db.$transaction).mockImplementation(async () => {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "5",
          meta: {
            driverAdapterError: {
              cause: { constraint: { fields: ['"boardId"', '"code"'] } },
            },
          },
        });
      });

      await expect(
        createProgramme(mockActor, { boardId: "1", code: "ICSE", name: "ICSE" }),
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

      const err = await createProgramme(mockActor, {
        boardId: "1",
        code: "ICSE",
        name: "ICSE",
      }).catch((e) => e);
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

      const err = await createProgramme(mockActor, {
        boardId: "1",
        code: "ICSE",
        name: "ICSE",
      }).catch((e) => e);
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      expect(err.code).not.toBe("DUPLICATE_IDENTITY");
    });
  });

  describe("updateProgramme", () => {
    it("rejects update if archived", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          programme: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: new Date() }),
          },
        };
        return cb(tx as any);
      });

      await expect(
        updateProgramme(mockActor, "1", { name: "New" }),
      ).rejects.toMatchObject({
        code: "INVALID_LIFECYCLE",
      });
    });
  });

  describe("archiveProgramme", () => {
    it("throws ARCHIVE_BLOCKED if unarchived dependants exist", async () => {
      vi.mocked(db.$transaction).mockImplementation(async (cb) => {
        const tx = {
          programme: {
            findUnique: vi.fn().mockResolvedValue({ id: "1", archivedAt: null }),
          },
          curriculumTrack: {
            count: vi.fn().mockResolvedValue(1),
          },
        };
        return cb(tx as any);
      });

      await expect(archiveProgramme(mockActor, "1")).rejects.toMatchObject({
        code: "ARCHIVE_BLOCKED",
      });
    });
  });
});
