import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTrack } from "./tracks";
import { db } from "../../../lib/db";
import { DomainError } from "../../../lib/domain/errors";
import { Prisma, Board, Subject, Programme } from "@prisma/client";

vi.mock("../../../lib/db", () => ({
  db: {
    $transaction: vi.fn((callback) => callback(db)),
    board: { findUnique: vi.fn() },
    programme: { findUnique: vi.fn() },
    subject: { findUnique: vi.fn() },
    curriculumTrack: { create: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

describe("Curriculum Track Service", () => {
  const actor = {
    userId: "test-user-id",
    role: "ADMIN",
    metadata: { role: "ADMIN", status: "active" },
  };
  const baseData = {
    boardId: "board-1",
    programmeId: null,
    classLevel: "IX" as const,
    subjectId: "sub-1",
    displayName: "Track",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTrack", () => {
    it("throws if board is not found", async () => {
      vi.mocked(db.board.findUnique).mockResolvedValue(null);
      await expect(createTrack(actor, baseData)).rejects.toThrow(DomainError);
      await expect(createTrack(actor, baseData)).rejects.toHaveProperty(
        "code",
        "NOT_FOUND",
      );
    });

    it("throws if programme does not belong to board", async () => {
      vi.mocked(db.board.findUnique).mockResolvedValue({
        id: "board-1",
        archivedAt: null,
      } as unknown as Board);
      vi.mocked(db.programme.findUnique).mockResolvedValue({
        id: "prog-1",
        boardId: "other-board", // mismatch
        archivedAt: null,
      } as unknown as Programme);

      await expect(
        createTrack(actor, { ...baseData, programmeId: "prog-1" }),
      ).rejects.toThrowError(/Programme must belong to the selected board/);
    });

    it("handles P2002 via constraint name", async () => {
      vi.mocked(db.board.findUnique).mockResolvedValue({
        id: "board-1",
        code: "CBSE",
        archivedAt: null,
      } as unknown as Board);
      vi.mocked(db.subject.findUnique).mockResolvedValue({
        id: "sub-1",
        archivedAt: null,
      } as unknown as Subject);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "7.8.0",
        },
      );
      // Simulate PgAdapter error structure with constraint.name
      (p2002Error as unknown as Record<string, unknown>).meta = {
        driverAdapterError: {
          cause: {
            constraint: { name: "CurriculumTrack_board_class_subject_null_prog_key" },
          },
        },
      };

      vi.mocked(db.curriculumTrack.create).mockRejectedValue(p2002Error);

      await expect(createTrack(actor, baseData)).rejects.toThrow(DomainError);
      await expect(createTrack(actor, baseData)).rejects.toHaveProperty(
        "code",
        "DUPLICATE_IDENTITY",
      );
    });
  });
});
