import { Prisma, FeeAssignmentStatus } from "@prisma/client";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { DomainError } from "../../lib/domain/errors";
import { ServiceResult, success, failure } from "./types";

// ─── Input / Result Types ────────────────────────────────────────────

export interface FeeAssignmentTargetInput {
  feePlanId: string;
  enrolmentIds: string[];
  startsOn: string; // YYYY-MM-DD
  endsOn?: string | null; // YYYY-MM-DD
}

interface PreviewDue {
  label: string;
  dueDate: string; // ISO string
  amountDue: number;
  feePlanInstallmentId: string;
}

interface PreviewItem {
  enrolmentId: string;
  studentName: string | null;
  studentCode: string | null;
  valid: boolean;
  error?: string;
  hasExistingActiveAssignment: boolean;
  proposedDues: PreviewDue[];
  totalAmount: number;
}

export interface PreviewFeeAssignmentResult {
  feePlan: { id: string; name: string; totalAmount: number };
  startsOn: string;
  endsOn: string | null;
  items: PreviewItem[];
  totals: {
    enrolments: number;
    valid: number;
    invalid: number;
    duplicates: number;
    totalAmount: number;
  };
  warnings: string[];
}

interface ConfirmItem {
  enrolmentId: string;
  status: "created" | "skipped" | "failed";
  assignmentId?: string;
  reason?: string;
}

export interface ConfirmFeeAssignmentResult {
  created: number;
  skipped: number;
  failed: number;
  items: ConfirmItem[];
}

interface ListAssignmentsParams {
  query?: string;
  status?: FeeAssignmentStatus;
  page?: number;
  pageSize?: number;
}

interface ListAssignmentRow {
  id: string;
  enrolmentId: string;
  feePlanId: string;
  assignedTotalAmount: number;
  startsOn: Date;
  endsOn: Date | null;
  status: FeeAssignmentStatus;
  archivedAt: Date | null;
  createdAt: Date;
  student: { id: string; fullName: string; studentCode: string } | null;
  feePlan: { id: string; name: string } | null;
  dueCount: number;
}

interface ListAssignmentsResult {
  items: ListAssignmentRow[];
  total: number;
  page: number;
  pageSize: number;
}

type AssignmentWithRelations = Prisma.StudentFeeAssignmentGetPayload<{
  include: {
    enrolment: {
      include: {
        student: true;
        batch: true;
        academicSession: true;
        curriculumTrack: true;
      };
    };
    feePlan: { include: { instalments: { orderBy: { displayOrder: "asc" } } } };
    dues: { orderBy: { dueDate: "asc" } };
  };
}>;

type StudentAssignmentView = Prisma.StudentFeeAssignmentGetPayload<{
  include: {
    feePlan: true;
    enrolment: {
      include: {
        student: true;
        batch: true;
        academicSession: true;
        curriculumTrack: true;
      };
    };
    dues: { orderBy: { dueDate: "asc" } };
  };
}>;

export interface StudentFeeDuesResult {
  student: {
    id: string;
    fullName: string;
    studentCode: string;
  };
  assignments: StudentAssignmentView[];
}

// ─── Helpers ─────────────────────────────────────────────────────────

function toDateValue(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function resolveDueDate(
  inst: { dueDate: Date | null; dueOffsetDays: number | null },
  startsOn: Date,
): Date {
  if (inst.dueDate) return inst.dueDate;
  if (inst.dueOffsetDays != null) return addDays(startsOn, inst.dueOffsetDays);
  throw new DomainError(
    "INVALID_RELATION",
    "Installment is missing both dueDate and dueOffsetDays",
  );
}

// ─── Preview ──────────────────────────────────────────────────────────

export async function previewFeeAssignment(
  actor: ActorContext,
  input: FeeAssignmentTargetInput,
): Promise<ServiceResult<PreviewFeeAssignmentResult>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const feePlan = await db.feePlan.findUnique({
    where: { id: input.feePlanId },
    include: {
      instalments: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
  });
  if (!feePlan) return failure("NOT_FOUND", "Fee plan not found");
  if (feePlan.archivedAt || !feePlan.isActive) {
    return failure("INVALID_RELATION", "Fee plan is not available for assignment");
  }

  const startsOnDate = toDateValue(input.startsOn);
  const assignedTotal = feePlan.instalments.reduce(
    (sum, inst) => sum + inst.amount.toNumber(),
    0,
  );
  const warnings: string[] = [];

  const items: PreviewItem[] = [];
  let validCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;

  for (const enrolmentId of input.enrolmentIds) {
    const enrolment = await db.enrolment.findUnique({
      where: { id: enrolmentId },
      include: { student: true },
    });

    if (!enrolment || enrolment.archivedAt) {
      invalidCount++;
      items.push({
        enrolmentId,
        studentName: null,
        studentCode: null,
        valid: false,
        error: "Enrolment not found or archived",
        hasExistingActiveAssignment: false,
        proposedDues: [],
        totalAmount: 0,
      });
      continue;
    }

    const existing = await db.studentFeeAssignment.findFirst({
      where: {
        enrolmentId,
        feePlanId: feePlan.id,
        status: "ACTIVE",
        archivedAt: null,
      },
    });
    const hasExisting = Boolean(existing);
    if (hasExisting) duplicateCount++;

    const proposedDues: PreviewDue[] = [];
    let invalidInstallment = false;
    for (const inst of feePlan.instalments) {
      try {
        const dueDate = resolveDueDate(inst, startsOnDate);
        proposedDues.push({
          label: inst.label,
          dueDate: dueDate.toISOString(),
          amountDue: inst.amount.toNumber(),
          feePlanInstallmentId: inst.id,
        });
      } catch {
        invalidInstallment = true;
        warnings.push(
          `Installment "${inst.label}" (enrolment ${enrolment.student?.fullName ?? enrolmentId}) has no due date or offset.`,
        );
      }
    }

    const valid = !hasExisting && !invalidInstallment;
    if (valid) validCount++;
    else if (!hasExisting && invalidInstallment) invalidCount++;

    items.push({
      enrolmentId,
      studentName: enrolment.student?.fullName ?? null,
      studentCode: enrolment.student?.studentCode ?? null,
      valid,
      hasExistingActiveAssignment: hasExisting,
      proposedDues,
      totalAmount: assignedTotal,
    });
  }

  return success({
    feePlan: {
      id: feePlan.id,
      name: feePlan.name,
      totalAmount: feePlan.totalAmount.toNumber(),
    },
    startsOn: input.startsOn,
    endsOn: input.endsOn ?? null,
    items,
    totals: {
      enrolments: input.enrolmentIds.length,
      valid: validCount,
      invalid: invalidCount,
      duplicates: duplicateCount,
      totalAmount: assignedTotal,
    },
    warnings,
  });
}

// ─── Confirm ──────────────────────────────────────────────────────────

export async function confirmFeeAssignment(
  actor: ActorContext,
  input: FeeAssignmentTargetInput,
): Promise<ServiceResult<ConfirmFeeAssignmentResult>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const feePlan = await db.feePlan.findUnique({
    where: { id: input.feePlanId },
    include: {
      instalments: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
  });
  if (!feePlan) return failure("NOT_FOUND", "Fee plan not found");
  if (feePlan.archivedAt || !feePlan.isActive) {
    return failure("INVALID_RELATION", "Fee plan is not available for assignment");
  }
  if (feePlan.instalments.length === 0) {
    return failure("INVALID_RELATION", "Fee plan has no active installments");
  }

  const startsOnDate = toDateValue(input.startsOn);
  const endsOnDate = input.endsOn ? toDateValue(input.endsOn) : null;
  const assignedTotal = feePlan.instalments.reduce(
    (sum, inst) => sum + inst.amount.toNumber(),
    0,
  );

  const items: ConfirmItem[] = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const enrolmentId of input.enrolmentIds) {
    try {
      const result = await db.$transaction(
        async (tx) => {
          const existing = await tx.studentFeeAssignment.findFirst({
            where: {
              enrolmentId,
              feePlanId: feePlan.id,
              status: "ACTIVE",
              archivedAt: null,
            },
          });
          if (existing) {
            return { skipped: true as const };
          }

          const enrolment = await tx.enrolment.findUnique({
            where: { id: enrolmentId },
            include: { student: true },
          });
          if (!enrolment || enrolment.archivedAt) {
            throw new DomainError("INVALID_RELATION", "Enrolment not found or archived");
          }

          const assignment = await tx.studentFeeAssignment.create({
            data: {
              enrolmentId,
              feePlanId: feePlan.id,
              assignedTotalAmount: new Prisma.Decimal(assignedTotal),
              startsOn: startsOnDate,
              endsOn: endsOnDate,
              status: "ACTIVE",
              createdBy: actor.userId,
            },
          });

          for (const inst of feePlan.instalments) {
            const dueDate = resolveDueDate(inst, startsOnDate);
            await tx.studentFeeDue.create({
              data: {
                feeAssignmentId: assignment.id,
                feePlanInstallmentId: inst.id,
                label: inst.label,
                dueDate,
                amountDue: inst.amount,
                amountWaived: new Prisma.Decimal(0),
                status: "PENDING",
              },
            });
          }

          await createAuditLog(tx, actor, {
            action: "FEE_ASSIGNMENT_CREATE",
            entityType: "StudentFeeAssignment",
            entityId: assignment.id,
            summary: `Assigned fee plan "${feePlan.name}" to ${enrolment.student?.fullName ?? enrolmentId}`,
            metadata: {
              enrolmentId,
              feePlanId: feePlan.id,
              assignedTotalAmount: assignedTotal,
              dueCount: feePlan.instalments.length,
            },
          });

          return { skipped: false as const, assignmentId: assignment.id };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      if (result.skipped) {
        skipped++;
        items.push({ enrolmentId, status: "skipped", reason: "ALREADY_EXISTS" });
      } else {
        created++;
        items.push({
          enrolmentId,
          status: "created",
          assignmentId: result.assignmentId,
        });
      }
    } catch (error) {
      failed++;
      let reason = "ERROR";
      if (error instanceof DomainError) reason = error.code;
      else if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        reason = "DUPLICATE";
      }
      items.push({ enrolmentId, status: "failed", reason });
    }
  }

  return success({ created, skipped, failed, items });
}

// ─── Archive / Restore ────────────────────────────────────────────────

export async function archiveFeeAssignment(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<Prisma.StudentFeeAssignmentGetPayload<object>>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const existing = await db.studentFeeAssignment.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Fee assignment not found");
  if (existing.archivedAt) return success(existing);

  const updated = await db.$transaction(async (tx) => {
    const assignment = await tx.studentFeeAssignment.update({
      where: { id },
      data: { archivedAt: new Date(), archivedBy: actor.userId },
    });
    await createAuditLog(tx, actor, {
      action: "FEE_ASSIGNMENT_ARCHIVE",
      entityType: "StudentFeeAssignment",
      entityId: id,
      summary: `Archived fee assignment ${id}`,
      metadata: { id },
    });
    return assignment;
  });

  return success(updated);
}

export async function restoreFeeAssignment(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<Prisma.StudentFeeAssignmentGetPayload<object>>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const existing = await db.studentFeeAssignment.findUnique({ where: { id } });
  if (!existing) return failure("NOT_FOUND", "Fee assignment not found");
  if (!existing.archivedAt) return success(existing);

  const conflict = await db.studentFeeAssignment.findFirst({
    where: {
      enrolmentId: existing.enrolmentId,
      feePlanId: existing.feePlanId,
      status: "ACTIVE",
      archivedAt: null,
      NOT: { id },
    },
  });
  if (conflict) {
    return failure(
      "DUPLICATE_IDENTITY",
      "An active assignment for this enrolment and fee plan already exists",
    );
  }

  const updated = await db.$transaction(async (tx) => {
    const assignment = await tx.studentFeeAssignment.update({
      where: { id },
      data: { archivedAt: null, archivedBy: null, updatedBy: actor.userId },
    });
    await createAuditLog(tx, actor, {
      action: "FEE_ASSIGNMENT_RESTORE",
      entityType: "StudentFeeAssignment",
      entityId: id,
      summary: `Restored fee assignment ${id}`,
      metadata: { id },
    });
    return assignment;
  });

  return success(updated);
}

// ─── Admin Listing / Detail ───────────────────────────────────────────

export async function listAssignments(
  actor: ActorContext,
  params: ListAssignmentsParams = {},
): Promise<ServiceResult<ListAssignmentsResult>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 20));

  const where: Prisma.StudentFeeAssignmentWhereInput = { archivedAt: null };
  if (params.status) where.status = params.status;
  if (params.query) {
    where.enrolment = {
      student: {
        OR: [
          { fullName: { contains: params.query, mode: "insensitive" } },
          { studentCode: { contains: params.query, mode: "insensitive" } },
        ],
      },
    };
  }

  const [total, items] = await db.$transaction([
    db.studentFeeAssignment.count({ where }),
    db.studentFeeAssignment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        enrolment: { include: { student: true } },
        feePlan: true,
        _count: { select: { dues: true } },
      },
    }),
  ]);

  const mapped: ListAssignmentRow[] = items.map((a) => ({
    id: a.id,
    enrolmentId: a.enrolmentId,
    feePlanId: a.feePlanId,
    assignedTotalAmount: a.assignedTotalAmount.toNumber(),
    startsOn: a.startsOn,
    endsOn: a.endsOn,
    status: a.status,
    archivedAt: a.archivedAt,
    createdAt: a.createdAt,
    student: a.enrolment?.student
      ? {
          id: a.enrolment.student.id,
          fullName: a.enrolment.student.fullName,
          studentCode: a.enrolment.student.studentCode,
        }
      : null,
    feePlan: a.feePlan ? { id: a.feePlan.id, name: a.feePlan.name } : null,
    dueCount: a._count.dues,
  }));

  return success({ items: mapped, total, page, pageSize });
}

export async function getAssignment(
  actor: ActorContext,
  id: string,
): Promise<ServiceResult<AssignmentWithRelations>> {
  if (actor.role !== "ADMIN") {
    return failure("UNAUTHORIZED", "Admin access required");
  }

  const assignment = await db.studentFeeAssignment.findUnique({
    where: { id },
    include: {
      enrolment: {
        include: {
          student: true,
          batch: true,
          academicSession: true,
          curriculumTrack: true,
        },
      },
      feePlan: { include: { instalments: { orderBy: { displayOrder: "asc" } } } },
      dues: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!assignment) return failure("NOT_FOUND", "Fee assignment not found");

  return success(assignment);
}

// ─── Student Visibility ───────────────────────────────────────────────

export async function listStudentFeeDues(
  actor: ActorContext,
): Promise<ServiceResult<StudentFeeDuesResult>> {
  if (actor.role !== "STUDENT") {
    return failure("UNAUTHORIZED", "Student access required");
  }

  const appUser = await db.appUser.findUnique({
    where: { id: actor.userId },
    include: {
      student: {
        include: {
          enrolments: {
            where: { status: "active", archivedAt: null },
            include: {
              batch: true,
              academicSession: true,
              curriculumTrack: true,
            },
          },
        },
      },
    },
  });

  if (!appUser || !appUser.studentId || !appUser.student) {
    return failure("UNAUTHORIZED", "Valid student required");
  }

  const enrolmentIds = appUser.student.enrolments.map((e) => e.id);
  if (enrolmentIds.length === 0) {
    return success({ student: appUser.student, assignments: [] });
  }

  const assignments = await db.studentFeeAssignment.findMany({
    where: {
      enrolmentId: { in: enrolmentIds },
      status: "ACTIVE",
      archivedAt: null,
    },
    include: {
      feePlan: true,
      enrolment: {
        include: {
          student: true,
          batch: true,
          academicSession: true,
          curriculumTrack: true,
        },
      },
      dues: { orderBy: { dueDate: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success({ student: appUser.student, assignments });
}
