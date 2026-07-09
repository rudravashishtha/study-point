import { db } from "../../lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { ServiceResult, success, failure } from "./types";
import { extractPrismaConstraintName } from "../../lib/db/errors";

export const createStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  phone: z.string().max(20).optional().nullable(),
  guardianPhone: z.string().max(20).optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  joiningDate: z.date().optional().nullable(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required").max(100).optional(),
  phone: z.string().max(20).optional().nullable().or(z.literal("")),
  guardianPhone: z.string().max(20).optional().nullable().or(z.literal("")),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal("")),
  joiningDate: z.date().optional().nullable(),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

export const listStudentsSchema = z.object({
  q: z.string().optional(),
  accountStatus: z.enum(["none", "invited", "active", "disabled"]).optional(),
  archiveState: z.enum(["ACTIVE_ONLY", "ARCHIVED_ONLY", "ALL"]).default("ACTIVE_ONLY"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sort: z
    .enum(["fullName", "studentCode", "joiningDate", "createdAt", "updatedAt"])
    .default("fullName"),
  direction: z.enum(["asc", "desc"]).default("asc"),
});
export type ListStudentsInput = z.infer<typeof listStudentsSchema>;

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

  const padded = seq.lastValue.toString().padStart(4, "0");
  return `STU-${year}-${padded}`;
}

export async function createStudent(
  input: CreateStudentInput,
  actorUserId?: string,
  currentYear: number = new Date().getFullYear(),
): Promise<ServiceResult<{ id: string; studentCode: string }>> {
  try {
    const data = createStudentSchema.parse(input);

    const result = await db.$transaction(async (tx) => {
      const studentCode = await generateStudentCode(tx, currentYear);

      const student = await tx.student.create({
        data: {
          studentCode,
          fullName: data.fullName,
          phone: data.phone || null,
          guardianPhone: data.guardianPhone || null,
          email: data.email || null,
          joiningDate: data.joiningDate || null,
          accountStatus: "none",
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "CREATE",
          entityType: "STUDENT",
          entityId: student.id,
          summary: `Created student ${student.studentCode}`,
          metadata: { studentCode: student.studentCode, fullName: student.fullName },
        },
      });

      return { id: student.id, studentCode: student.studentCode };
    });

    return success(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0].message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const constraint = extractPrismaConstraintName(error);
      if (constraint === "Student_studentCode_key") {
        return failure("DUPLICATE_IDENTITY", "Student code already exists.");
      }
    }
    console.error("createStudent error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function updateStudent(
  input: UpdateStudentInput,
  actorUserId?: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const { id, ...data } = updateStudentSchema.parse(input);

    return await db.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({ where: { id } });
      if (!existing) return failure("NOT_FOUND", "Student not found");
      if (existing.archivedAt)
        return failure("INVALID_LIFECYCLE", "Cannot update an archived student");

      const updateData: Prisma.StudentUpdateInput = {};
      if (data.fullName !== undefined) updateData.fullName = data.fullName;
      if (data.phone !== undefined) updateData.phone = data.phone || null;
      if (data.guardianPhone !== undefined)
        updateData.guardianPhone = data.guardianPhone || null;
      if (data.email !== undefined) updateData.email = data.email || null;
      if (data.joiningDate !== undefined)
        updateData.joiningDate = data.joiningDate || null;

      if (Object.keys(updateData).length === 0) {
        return success({ id });
      }

      const updated = await tx.student.update({
        where: { id },
        data: updateData,
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "UPDATE",
          entityType: "STUDENT",
          entityId: id,
          summary: `Updated student ${existing.studentCode}`,
          metadata: { previousValues: existing, newValues: updated },
        },
      });

      return success({ id });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0].message);
    }
    console.error("updateStudent error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function archiveStudent(
  id: string,
  actorUserId?: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({ where: { id } });
      if (!existing) return failure("NOT_FOUND", "Student not found");
      if (existing.archivedAt)
        return failure("INVALID_LIFECYCLE", "Student is already archived");

      const count = await tx.enrolment.count({
        where: {
          studentId: id,
          archivedAt: null,
        },
      });

      if (count > 0) {
        return failure(
          "ARCHIVE_BLOCKED",
          "Cannot archive student with unarchived enrolments.",
        );
      }

      await tx.student.update({
        where: { id },
        data: { archivedAt: new Date(), archivedBy: actorUserId },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "ARCHIVE",
          entityType: "STUDENT",
          entityId: id,
          summary: `Archived student ${existing.studentCode}`,
          metadata: {},
        },
      });

      return success({ id });
    });
  } catch (error) {
    console.error("archiveStudent error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function restoreStudent(
  id: string,
  actorUserId?: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({ where: { id } });
      if (!existing) return failure("NOT_FOUND", "Student not found");
      if (!existing.archivedAt) return success({ id }); // true no-op

      await tx.student.update({
        where: { id },
        data: { archivedAt: null, archivedBy: null },
      });

      await tx.auditLog.create({
        data: {
          actorUserId,
          action: "RESTORE",
          entityType: "STUDENT",
          entityId: id,
          summary: `Restored student ${existing.studentCode}`,
          metadata: {},
        },
      });

      return success({ id });
    });
  } catch (error) {
    console.error("restoreStudent error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function listStudents(input: ListStudentsInput) {
  try {
    const params = listStudentsSchema.parse(input);
    const { q, accountStatus, archiveState, page, pageSize, sort, direction } = params;

    const where: Prisma.StudentWhereInput = {};

    if (q) {
      where.OR = [
        { studentCode: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
      ];
    }

    if (accountStatus) {
      where.accountStatus = accountStatus;
    }

    if (archiveState === "ACTIVE_ONLY") {
      where.archivedAt = null;
    } else if (archiveState === "ARCHIVED_ONLY") {
      where.archivedAt = { not: null };
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, totalCount] = await Promise.all([
      db.student.findMany({
        where,
        orderBy: { [sort]: direction },
        skip,
        take,
      }),
      db.student.count({ where }),
    ]);

    return success({
      items,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return failure("VALIDATION_ERROR", error.issues[0].message);
    }
    console.error("listStudents error:", error);
    return failure("INTERNAL_ERROR", "An unexpected error occurred.");
  }
}
