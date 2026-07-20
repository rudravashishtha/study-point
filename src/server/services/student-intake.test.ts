import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentIntakeSubmissionStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    academicSession: { findUnique: vi.fn() },
    curriculumTrack: { findUnique: vi.fn() },
    batch: { findUnique: vi.fn() },
    studentIntakeLink: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    studentIntakeSubmission: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/domain/audit", () => ({
  createAuditLog: vi.fn(),
}));

import { db } from "@/lib/db";
import {
  convertSubmissionToStudent,
  createIntakeLink,
  deleteArchivedIntakeLink,
  hashIntakeToken,
  replaceIntakeLinkToken,
  resolveIntakeLinkByToken,
  submitIntakeForm,
} from "./student-intake";

const actor = {
  userId: "admin-1",
  role: "ADMIN" as const,
  metadata: { role: "ADMIN", status: "ACTIVE" },
};

const sessionId = "11111111-1111-4111-8111-111111111111";
const trackId = "22222222-2222-4222-8222-222222222222";
const submissionId = "33333333-3333-4333-8333-333333333333";

describe("student intake service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a link with only the token hash stored", async () => {
    vi.mocked(db.academicSession.findUnique).mockResolvedValue({
      archivedAt: null,
    } as never);

    const tx = {
      studentIntakeLink: {
        create: vi.fn().mockResolvedValue({
          id: "link-1",
          label: "Class X",
          academicSessionId: sessionId,
          curriculumTrackId: null,
          batchId: null,
          expiresAt: null,
          maxSubmissions: null,
        }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await createIntakeLink(
      {
        label: "Class X",
        academicSessionId: sessionId,
      },
      actor,
    );

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rawToken).toHaveLength(43);
    const createCall = tx.studentIntakeLink.create.mock.calls[0][0];
    expect(createCall.data.tokenHash).toBe(hashIntakeToken(result.data.rawToken));
    expect(JSON.stringify(createCall.data)).not.toContain(result.data.rawToken);
  });

  it("rejects inactive, expired, and full token links safely", async () => {
    vi.mocked(db.studentIntakeLink.findUnique).mockResolvedValueOnce({
      isActive: false,
      archivedAt: null,
    } as never);
    await expect(resolveIntakeLinkByToken("raw-token")).resolves.toMatchObject({
      success: false,
      error: { code: "LINK_UNAVAILABLE" },
    });

    vi.mocked(db.studentIntakeLink.findUnique).mockResolvedValueOnce({
      isActive: true,
      archivedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(resolveIntakeLinkByToken("raw-token")).resolves.toMatchObject({
      success: false,
      error: { code: "LINK_EXPIRED" },
    });

    vi.mocked(db.studentIntakeLink.findUnique).mockResolvedValueOnce({
      isActive: true,
      archivedAt: null,
      expiresAt: null,
      maxSubmissions: 1,
      submissionCount: 1,
    } as never);
    await expect(resolveIntakeLinkByToken("raw-token")).resolves.toMatchObject({
      success: false,
      error: { code: "LINK_CLOSED" },
    });
  });

  it("public submission creates only an intake record and increments the link count", async () => {
    const tx = {
      studentIntakeLink: {
        findUnique: vi.fn().mockResolvedValue({
          id: "link-1",
          isActive: true,
          archivedAt: null,
          expiresAt: null,
          maxSubmissions: 10,
          submissionCount: 0,
          academicSessionId: sessionId,
          curriculumTrackId: trackId,
          batchId: null,
        }),
        update: vi.fn(),
      },
      studentIntakeSubmission: {
        create: vi.fn().mockResolvedValue({ id: "submission-1" }),
      },
      student: { create: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await submitIntakeForm({
      token: "valid-token-value-123456",
      studentName: "Asha Sharma",
      phone: "9999999999",
      guardianName: null,
      guardianPhone: null,
      email: null,
      school: null,
      address: null,
      message: null,
    });

    expect(result).toEqual({ success: true, data: { id: "submission-1" } });
    expect(tx.studentIntakeSubmission.create).toHaveBeenCalledOnce();
    expect(tx.studentIntakeLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { submissionCount: { increment: 1 } },
    });
    expect(tx.student.create).not.toHaveBeenCalled();
  });

  it("does not convert a submission twice", async () => {
    const tx = {
      studentIntakeSubmission: {
        findUnique: vi.fn().mockResolvedValue({
          id: "submission-1",
          status: StudentIntakeSubmissionStatus.CONVERTED,
          convertedStudentId: "student-1",
        }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await convertSubmissionToStudent(
      { id: submissionId, createEnrolment: true },
      actor,
    );

    expect(result).toMatchObject({
      success: false,
      error: { code: "INVALID_STATUS" },
    });
  });

  it("only deletes archived intake links", async () => {
    const tx = {
      studentIntakeLink: {
        findUnique: vi.fn().mockResolvedValue({
          id: "link-1",
          label: "Active link",
          archivedAt: null,
          _count: { submissions: 0 },
        }),
        delete: vi.fn(),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await deleteArchivedIntakeLink("link-1", actor);

    expect(result).toMatchObject({
      success: false,
      error: { code: "INVALID_LIFECYCLE" },
    });
    expect(tx.studentIntakeLink.delete).not.toHaveBeenCalled();
  });

  it("does not delete archived intake links with submissions", async () => {
    const tx = {
      studentIntakeLink: {
        findUnique: vi.fn().mockResolvedValue({
          id: "link-1",
          label: "Archived link",
          archivedAt: new Date(),
          _count: { submissions: 2 },
        }),
        delete: vi.fn(),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await deleteArchivedIntakeLink("link-1", actor);

    expect(result).toMatchObject({
      success: false,
      error: { code: "DELETE_BLOCKED" },
    });
    expect(tx.studentIntakeLink.delete).not.toHaveBeenCalled();
  });

  it("replaces an active intake URL without storing the raw token", async () => {
    const tx = {
      studentIntakeLink: {
        findUnique: vi.fn().mockResolvedValue({
          id: "link-1",
          label: "Class X",
          isActive: true,
          archivedAt: null,
          expiresAt: null,
          maxSubmissions: null,
          submissionCount: 0,
          updatedAt: new Date(),
        }),
        update: vi.fn().mockResolvedValue({ id: "link-1" }),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await replaceIntakeLinkToken("link-1", actor);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rawToken).toHaveLength(43);
    expect(tx.studentIntakeLink.update).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: { tokenHash: hashIntakeToken(result.data.rawToken) },
    });
    expect(JSON.stringify(tx.studentIntakeLink.update.mock.calls[0][0])).not.toContain(
      result.data.rawToken,
    );
  });

  it("does not replace URLs for inactive intake links", async () => {
    const tx = {
      studentIntakeLink: {
        findUnique: vi.fn().mockResolvedValue({
          id: "link-1",
          label: "Inactive link",
          isActive: false,
          archivedAt: null,
        }),
        update: vi.fn(),
      },
    };
    vi.mocked(db.$transaction).mockImplementation(async (callback) => callback(tx as never));

    const result = await replaceIntakeLinkToken("link-1", actor);

    expect(result).toMatchObject({
      success: false,
      error: { code: "INVALID_LIFECYCLE" },
    });
    expect(tx.studentIntakeLink.update).not.toHaveBeenCalled();
  });
});
