import crypto from "node:crypto";
import { Prisma, StudentIntakeSubmissionStatus } from "@prisma/client";
import { z } from "zod";

import { db } from "@/lib/db";
import { createAuditLog } from "@/lib/domain/audit";
import type { ActorContext } from "@/lib/domain/actor";
import {
  convertSubmissionSchema,
  createIntakeLinkSchema,
  listIntakeLinksSchema,
  listIntakeSubmissionsSchema,
  publicIntakeSubmissionSchema,
  rejectSubmissionSchema,
  updateSubmissionReviewSchema,
  type ConvertSubmissionInput,
  type CreateIntakeLinkInput,
  type ListIntakeLinksInput,
  type ListIntakeSubmissionsInput,
  type PublicIntakeSubmissionInput,
  type RejectSubmissionInput,
  type UpdateSubmissionReviewInput,
} from "@/lib/validation/student-intake";
import { failure, success, type ServiceResult } from "./types";

const tokenByteLength = 32;

export function hashIntakeToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRawToken() {
  return crypto.randomBytes(tokenByteLength).toString("base64url");
}

async function generateStudentCode(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const sequenceId = `STUDENT_CODE_${year}`;
  const seq = await tx.systemSequence.upsert({
    where: { id: sequenceId },
    create: { id: sequenceId, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });

  return `STU-${year}-${seq.lastValue.toString().padStart(4, "0")}`;
}

async function normalizeLinkContext(input: CreateIntakeLinkInput) {
  if (!input.batchId) {
    return {
      academicSessionId: input.academicSessionId,
      curriculumTrackId: input.curriculumTrackId || null,
      batchId: null,
    };
  }

  const batch = await db.batch.findUnique({
    where: { id: input.batchId },
    select: {
      id: true,
      academicSessionId: true,
      curriculumTrackId: true,
      archivedAt: true,
    },
  });

  if (!batch || batch.archivedAt) {
    return null;
  }

  if (batch.academicSessionId !== input.academicSessionId) {
    return null;
  }

  if (input.curriculumTrackId && batch.curriculumTrackId !== input.curriculumTrackId) {
    return null;
  }

  return {
    academicSessionId: batch.academicSessionId,
    curriculumTrackId: batch.curriculumTrackId,
    batchId: batch.id,
  };
}

export async function createIntakeLink(
  input: CreateIntakeLinkInput,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string; rawToken: string }>> {
  try {
    const parsed = createIntakeLinkSchema.parse(input);
    const context = await normalizeLinkContext(parsed);
    if (!context) {
      return failure("INVALID_CONTEXT", "Batch must belong to the selected session and class.");
    }

    if (context.curriculumTrackId) {
      const track = await db.curriculumTrack.findUnique({
        where: { id: context.curriculumTrackId },
        select: { archivedAt: true },
      });
      if (!track || track.archivedAt) {
        return failure("INVALID_CONTEXT", "Selected class is not available.");
      }
    }

    const session = await db.academicSession.findUnique({
      where: { id: context.academicSessionId },
      select: { archivedAt: true },
    });
    if (!session || session.archivedAt) {
      return failure("INVALID_CONTEXT", "Selected academic session is not available.");
    }

    const rawToken = generateRawToken();
    const tokenHash = hashIntakeToken(rawToken);

    const link = await db.$transaction(async (tx) => {
      const created = await tx.studentIntakeLink.create({
        data: {
          tokenHash,
          label: parsed.label,
          academicSessionId: context.academicSessionId,
          curriculumTrackId: context.curriculumTrackId,
          batchId: context.batchId,
          expiresAt: parsed.expiresAt || null,
          maxSubmissions: parsed.maxSubmissions || null,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "STUDENT_INTAKE_LINK",
        entityId: created.id,
        summary: `Created intake link ${created.label}`,
        metadata: {
          label: created.label,
          academicSessionId: created.academicSessionId,
          curriculumTrackId: created.curriculumTrackId,
          batchId: created.batchId,
          expiresAt: created.expiresAt,
          maxSubmissions: created.maxSubmissions,
        },
      });

      return created;
    });

    return success({ id: link.id, rawToken });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0]?.message || "Invalid input.");
    }
    console.error("createIntakeLink error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function listIntakeLinks(input: ListIntakeLinksInput) {
  const parsed = listIntakeLinksSchema.parse(input);
  const where: Prisma.StudentIntakeLinkWhereInput = {};

  if (parsed.q) {
    where.label = { contains: parsed.q, mode: "insensitive" };
  }
  if (parsed.archiveState === "ACTIVE_ONLY") where.archivedAt = null;
  if (parsed.archiveState === "ARCHIVED_ONLY") where.archivedAt = { not: null };

  const skip = (parsed.page - 1) * parsed.pageSize;
  const [items, totalCount] = await Promise.all([
    db.studentIntakeLink.findMany({
      where,
      include: {
        academicSession: true,
        curriculumTrack: { include: { board: true, subject: true, programme: true } },
        batch: true,
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parsed.pageSize,
    }),
    db.studentIntakeLink.count({ where }),
  ]);

  return { items, totalCount, page: parsed.page, pageSize: parsed.pageSize };
}

export async function deactivateIntakeLink(
  id: string,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.studentIntakeLink.findUnique({ where: { id } });
      if (!existing || existing.archivedAt) {
        return failure("NOT_FOUND", "Intake link not found.");
      }
      if (!existing.isActive) return success({ id });

      await tx.studentIntakeLink.update({ where: { id }, data: { isActive: false } });
      await createAuditLog(tx, actor, {
        action: "DEACTIVATE",
        entityType: "STUDENT_INTAKE_LINK",
        entityId: id,
        summary: `Deactivated intake link ${existing.label}`,
      });
      return success({ id });
    });
  } catch (error) {
    console.error("deactivateIntakeLink error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function archiveIntakeLink(
  id: string,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.studentIntakeLink.findUnique({ where: { id } });
      if (!existing) return failure("NOT_FOUND", "Intake link not found.");
      if (existing.archivedAt) return success({ id });

      await tx.studentIntakeLink.update({
        where: { id },
        data: { archivedAt: new Date(), archivedBy: actor.userId, isActive: false },
      });
      await createAuditLog(tx, actor, {
        action: "ARCHIVE",
        entityType: "STUDENT_INTAKE_LINK",
        entityId: id,
        summary: `Archived intake link ${existing.label}`,
      });
      return success({ id });
    });
  } catch (error) {
    console.error("archiveIntakeLink error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function deleteArchivedIntakeLink(
  id: string,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.studentIntakeLink.findUnique({
        where: { id },
        include: { _count: { select: { submissions: true } } },
      });
      if (!existing) return failure("NOT_FOUND", "Intake link not found.");
      if (!existing.archivedAt) {
        return failure("INVALID_LIFECYCLE", "Only archived intake links can be deleted.");
      }
      if (existing._count.submissions > 0) {
        return failure(
          "DELETE_BLOCKED",
          "Cannot delete an intake link that has submissions.",
        );
      }

      await tx.studentIntakeLink.delete({ where: { id } });
      await createAuditLog(tx, actor, {
        action: "DELETE",
        entityType: "STUDENT_INTAKE_LINK",
        entityId: id,
        summary: `Deleted archived intake link ${existing.label}`,
        metadata: {
          label: existing.label,
          archivedAt: existing.archivedAt,
        },
      });

      return success({ id });
    });
  } catch (error) {
    console.error("deleteArchivedIntakeLink error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function resolveIntakeLinkByToken(token: string) {
  const tokenHash = hashIntakeToken(token);
  const link = await db.studentIntakeLink.findUnique({
    where: { tokenHash },
    include: {
      academicSession: true,
      curriculumTrack: { include: { board: true, subject: true, programme: true } },
      batch: true,
    },
  });

  if (!link || link.archivedAt || !link.isActive) {
    return failure("LINK_UNAVAILABLE", "This intake link is not available.");
  }
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    return failure("LINK_EXPIRED", "This intake link has expired.");
  }
  if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
    return failure("LINK_CLOSED", "This intake link is no longer accepting submissions.");
  }

  return success(link);
}

export async function submitIntakeForm(
  input: PublicIntakeSubmissionInput,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const parsed = publicIntakeSubmissionSchema.parse(input);
    const tokenHash = hashIntakeToken(parsed.token);

    const submission = await db.$transaction(
      async (tx) => {
        const link = await tx.studentIntakeLink.findUnique({ where: { tokenHash } });
        if (!link || link.archivedAt || !link.isActive) {
          throw new Error("LINK_UNAVAILABLE");
        }
        if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
          throw new Error("LINK_EXPIRED");
        }
        if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
          throw new Error("LINK_CLOSED");
        }

        const created = await tx.studentIntakeSubmission.create({
          data: {
            intakeLinkId: link.id,
            studentName: parsed.studentName,
            phone: parsed.phone,
            guardianName: parsed.guardianName,
            guardianPhone: parsed.guardianPhone,
            email: parsed.email,
            school: parsed.school,
            address: parsed.address,
            message: parsed.message,
            academicSessionId: link.academicSessionId,
            curriculumTrackId: link.curriculumTrackId,
            batchId: link.batchId,
          },
        });

        await tx.studentIntakeLink.update({
          where: { id: link.id },
          data: { submissionCount: { increment: 1 } },
        });

        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return success({ id: submission.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0]?.message || "Invalid input.");
    }
    if (error instanceof Error) {
      if (error.message === "LINK_UNAVAILABLE") {
        return failure("LINK_UNAVAILABLE", "This intake link is not available.");
      }
      if (error.message === "LINK_EXPIRED") {
        return failure("LINK_EXPIRED", "This intake link has expired.");
      }
      if (error.message === "LINK_CLOSED") {
        return failure("LINK_CLOSED", "This intake link is no longer accepting submissions.");
      }
    }
    console.error("submitIntakeForm error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function listIntakeSubmissions(input: ListIntakeSubmissionsInput) {
  const parsed = listIntakeSubmissionsSchema.parse(input);
  const where: Prisma.StudentIntakeSubmissionWhereInput = {};

  if (parsed.q) {
    where.OR = [
      { studentName: { contains: parsed.q, mode: "insensitive" } },
      { phone: { contains: parsed.q, mode: "insensitive" } },
      { guardianPhone: { contains: parsed.q, mode: "insensitive" } },
      { email: { contains: parsed.q, mode: "insensitive" } },
    ];
  }
  if (parsed.status) where.status = parsed.status;
  if (parsed.academicSessionId) where.academicSessionId = parsed.academicSessionId;
  if (parsed.curriculumTrackId) where.curriculumTrackId = parsed.curriculumTrackId;
  if (parsed.batchId) where.batchId = parsed.batchId;

  const skip = (parsed.page - 1) * parsed.pageSize;
  const [items, totalCount] = await Promise.all([
    db.studentIntakeSubmission.findMany({
      where,
      include: {
        intakeLink: true,
        academicSession: true,
        curriculumTrack: { include: { board: true, subject: true, programme: true } },
        batch: true,
        convertedStudent: true,
      },
      orderBy: { submittedAt: "desc" },
      skip,
      take: parsed.pageSize,
    }),
    db.studentIntakeSubmission.count({ where }),
  ]);

  return { items, totalCount, page: parsed.page, pageSize: parsed.pageSize };
}

export async function updateSubmissionReview(
  input: UpdateSubmissionReviewInput,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const parsed = updateSubmissionReviewSchema.parse(input);
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.studentIntakeSubmission.findUnique({
        where: { id: parsed.id },
      });
      if (!existing) throw new Error("NOT_FOUND");
      if (existing.status === StudentIntakeSubmissionStatus.CONVERTED) {
        throw new Error("ALREADY_CONVERTED");
      }
      if (existing.status === StudentIntakeSubmissionStatus.REJECTED) {
        throw new Error("ALREADY_REJECTED");
      }

      const record = await tx.studentIntakeSubmission.update({
        where: { id: parsed.id },
        data: {
          status: parsed.status,
          adminNotes: parsed.adminNotes || null,
          reviewedAt: new Date(),
          reviewedBy: actor.userId,
        },
      });
      await createAuditLog(tx, actor, {
        action: "UPDATE_REVIEW",
        entityType: "STUDENT_INTAKE_SUBMISSION",
        entityId: record.id,
        summary: `Updated intake submission review for ${record.studentName}`,
        metadata: { status: record.status },
      });
      return record;
    });
    return success({ id: updated.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0]?.message || "Invalid input.");
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("NOT_FOUND", "Submission not found.");
    }
    if (error instanceof Error && error.message === "ALREADY_CONVERTED") {
      return failure("INVALID_STATUS", "Converted submissions cannot be edited.");
    }
    if (error instanceof Error && error.message === "ALREADY_REJECTED") {
      return failure("INVALID_STATUS", "Rejected submissions cannot be edited.");
    }
    console.error("updateSubmissionReview error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function rejectSubmission(
  input: RejectSubmissionInput,
  actor: ActorContext,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const parsed = rejectSubmissionSchema.parse(input);
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.studentIntakeSubmission.findUnique({
        where: { id: parsed.id },
      });
      if (!existing) throw new Error("NOT_FOUND");
      if (existing.status === StudentIntakeSubmissionStatus.CONVERTED) {
        throw new Error("ALREADY_CONVERTED");
      }

      const record = await tx.studentIntakeSubmission.update({
        where: { id: parsed.id },
        data: {
          status: StudentIntakeSubmissionStatus.REJECTED,
          adminNotes: parsed.adminNotes || null,
          reviewedAt: new Date(),
          reviewedBy: actor.userId,
        },
      });
      await createAuditLog(tx, actor, {
        action: "REJECT",
        entityType: "STUDENT_INTAKE_SUBMISSION",
        entityId: record.id,
        summary: `Rejected intake submission for ${record.studentName}`,
      });
      return record;
    });
    return success({ id: updated.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0]?.message || "Invalid input.");
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("NOT_FOUND", "Submission not found.");
    }
    if (error instanceof Error && error.message === "ALREADY_CONVERTED") {
      return failure("INVALID_STATUS", "Converted submissions cannot be rejected.");
    }
    console.error("rejectSubmission error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function convertSubmissionToStudent(
  input: ConvertSubmissionInput,
  actor: ActorContext,
): Promise<ServiceResult<{ studentId: string; enrolmentId: string | null }>> {
  try {
    const parsed = convertSubmissionSchema.parse(input);
    const result = await db.$transaction(
      async (tx) => {
        const submission = await tx.studentIntakeSubmission.findUnique({
          where: { id: parsed.id },
        });
        if (!submission) throw new Error("NOT_FOUND");
        if (submission.convertedStudentId) throw new Error("ALREADY_CONVERTED");
        if (submission.status === StudentIntakeSubmissionStatus.REJECTED) {
          throw new Error("REJECTED");
        }

        const studentCode = await generateStudentCode(tx, new Date().getFullYear());
        const student = await tx.student.create({
          data: {
            studentCode,
            fullName: submission.studentName,
            phone: submission.phone,
            guardianPhone: submission.guardianPhone,
            email: submission.email,
            joiningDate: new Date(),
            accountStatus: "none",
          },
        });

        let enrolmentId: string | null = null;
        if (
          parsed.createEnrolment &&
          submission.academicSessionId &&
          submission.curriculumTrackId
        ) {
          const enrolment = await tx.enrolment.create({
            data: {
              studentId: student.id,
              academicSessionId: submission.academicSessionId,
              curriculumTrackId: submission.curriculumTrackId,
              batchId: submission.batchId,
              joiningDate: new Date(),
              status: "active",
              createdBy: actor.userId,
            },
          });
          enrolmentId = enrolment.id;
        }

        await tx.studentIntakeSubmission.update({
          where: { id: submission.id },
          data: {
            status: StudentIntakeSubmissionStatus.CONVERTED,
            convertedStudentId: student.id,
            reviewedAt: new Date(),
            reviewedBy: actor.userId,
          },
        });

        await createAuditLog(tx, actor, {
          action: "CONVERT",
          entityType: "STUDENT_INTAKE_SUBMISSION",
          entityId: submission.id,
          summary: `Converted intake submission to student ${student.studentCode}`,
          metadata: {
            studentId: student.id,
            studentCode: student.studentCode,
            enrolmentId,
          },
        });

        return { studentId: student.id, enrolmentId };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return success(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0]?.message || "Invalid input.");
    }
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return failure("NOT_FOUND", "Submission not found.");
    }
    if (error instanceof Error && error.message === "ALREADY_CONVERTED") {
      return failure("INVALID_STATUS", "This submission has already been converted.");
    }
    if (error instanceof Error && error.message === "REJECTED") {
      return failure("INVALID_STATUS", "Rejected submissions cannot be converted.");
    }
    console.error("convertSubmissionToStudent error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}
