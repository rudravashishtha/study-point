import { Prisma, FeePlan, FeePlanInstallment } from "@prisma/client";
import { db } from "../../lib/db";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { DomainError } from "../../lib/domain/errors";

export type FeePlanWithInstallments = FeePlan & { instalments: FeePlanInstallment[] };

export async function listFeePlans(params: {
  query: string;
  archiveState: "active" | "archived" | "all";
  frequency?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
}) {
  const where: Prisma.FeePlanWhereInput = {};

  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.query) {
    where.OR = [
      { name: { contains: params.query, mode: "insensitive" } },
      { description: { contains: params.query, mode: "insensitive" } },
    ];
  }

  if (params.frequency) {
    where.frequency = params.frequency;
  }

  const data = await db.feePlan.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      instalments: { orderBy: { displayOrder: "asc" } },
      academicSession: true,
      curriculumTrack: { include: { board: true, subject: true } },
      batch: true,
    },
  });

  return data;
}

export async function getFeePlanById(id: string) {
  const plan = await db.feePlan.findUnique({
    where: { id },
    include: {
      instalments: { orderBy: { displayOrder: "asc" } },
      academicSession: true,
      curriculumTrack: { include: { board: true, subject: true } },
      batch: true,
    },
  });

  if (!plan) {
    throw new DomainError("NOT_FOUND", "Fee plan not found.");
  }

  return plan;
}

async function validateBatchOwnership(
  academicSessionId: string,
  curriculumTrackId: string,
  batchId: string | null | undefined,
) {
  if (!batchId) return;

  const batch = await db.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    throw new DomainError("INVALID_RELATION", "Batch not found.");
  }
  if (batch.academicSessionId !== academicSessionId) {
    throw new DomainError(
      "INVALID_RELATION",
      "Batch must belong to the same academic session as the fee plan.",
    );
  }
  if (batch.curriculumTrackId !== curriculumTrackId) {
    throw new DomainError(
      "INVALID_RELATION",
      "Batch must belong to the same curriculum track as the fee plan.",
    );
  }
}

function validateInstallmentTotal(
  instalments: { amount: number }[],
  totalAmount: number,
) {
  if (instalments.length === 0) return;

  const sum = instalments.reduce((acc, inst) => acc + inst.amount, 0);
  if (Math.abs(sum - totalAmount) > 0.01) {
    throw new DomainError(
      "INVALID_RELATION",
      `Installment total (${sum.toFixed(2)}) must equal the fee plan total amount (${totalAmount.toFixed(2)}).`,
    );
  }
}

export async function createFeePlan(
  actor: ActorContext,
  data: {
    academicSessionId: string;
    curriculumTrackId: string;
    batchId?: string | null;
    name: string;
    description?: string | null;
    totalAmount: number;
    frequency: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
    showPublicly: boolean;
    instalments?: {
      label: string;
      dueOffsetDays?: number | null;
      dueDate?: string | null;
      amount: number;
      displayOrder: number;
    }[];
  },
) {
  await validateBatchOwnership(
    data.academicSessionId,
    data.curriculumTrackId,
    data.batchId,
  );

  const instalments = data.instalments || [];

  if (data.frequency === "CUSTOM" && instalments.length === 0) {
    throw new DomainError(
      "INVALID_RELATION",
      "Custom frequency fee plans must have at least one installment.",
    );
  }

  validateInstallmentTotal(
    instalments.map((i) => ({ amount: i.amount })),
    data.totalAmount,
  );

  try {
    return await db.$transaction(async (tx) => {
      const plan = await tx.feePlan.create({
        data: {
          academicSessionId: data.academicSessionId,
          curriculumTrackId: data.curriculumTrackId,
          batchId: data.batchId || null,
          name: data.name,
          description: data.description || null,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          frequency: data.frequency,
          showPublicly: data.showPublicly,
          createdBy: actor.userId,
          instalments: {
            create: instalments.map((inst) => ({
              label: inst.label,
              dueOffsetDays: inst.dueOffsetDays ?? null,
              dueDate: inst.dueDate ? new Date(`${inst.dueDate}T00:00:00.000Z`) : null,
              amount: new Prisma.Decimal(inst.amount),
              displayOrder: inst.displayOrder,
            })),
          },
        },
        include: { instalments: { orderBy: { displayOrder: "asc" } } },
      });

      await createAuditLog(tx, actor, {
        action: "FEE_PLAN_CREATE",
        entityType: "FeePlan",
        entityId: plan.id,
        summary: `Created fee plan: ${plan.name}`,
        metadata: {
          name: plan.name,
          totalAmount: plan.totalAmount.toNumber(),
          frequency: plan.frequency,
        },
      });

      return plan;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A fee plan with these details already exists.",
      );
    }
    throw error;
  }
}

export async function updateFeePlan(
  actor: ActorContext,
  id: string,
  data: {
    batchId?: string | null;
    name?: string;
    description?: string | null;
    totalAmount?: number;
    frequency?: "MONTHLY" | "QUARTERLY" | "YEARLY" | "CUSTOM";
    showPublicly?: boolean;
    isActive?: boolean;
    instalments?: {
      id?: string;
      label: string;
      dueOffsetDays?: number | null;
      dueDate?: string | null;
      amount: number;
      displayOrder: number;
    }[];
  },
) {
  const existing = await db.feePlan.findUnique({
    where: { id },
    include: { instalments: true },
  });

  if (!existing) {
    throw new DomainError("NOT_FOUND", "Fee plan not found.");
  }

  if (existing.archivedAt) {
    throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived fee plan.");
  }

  if (data.batchId !== undefined) {
    await validateBatchOwnership(
      existing.academicSessionId,
      existing.curriculumTrackId,
      data.batchId,
    );
  }

  const resolvedTotalAmount = data.totalAmount ?? existing.totalAmount.toNumber();
  const resolvedFrequency = data.frequency ?? existing.frequency;
  const instalments = data.instalments;
  const willBeCustom = resolvedFrequency === "CUSTOM";

  if (instalments && instalments.length > 0) {
    validateInstallmentTotal(
      instalments.map((i) => ({ amount: i.amount })),
      resolvedTotalAmount,
    );
  } else if (willBeCustom && instalments && instalments.length === 0) {
    throw new DomainError(
      "INVALID_RELATION",
      "Custom frequency fee plans must have at least one installment.",
    );
  }

  try {
    return await db.$transaction(async (tx) => {
      const updateData: Prisma.FeePlanUpdateInput = {};
      if (data.batchId !== undefined)
        updateData.batch = data.batchId
          ? { connect: { id: data.batchId } }
          : { disconnect: true };
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.totalAmount !== undefined)
        updateData.totalAmount = new Prisma.Decimal(data.totalAmount);
      if (data.frequency !== undefined) updateData.frequency = data.frequency;
      if (data.showPublicly !== undefined) updateData.showPublicly = data.showPublicly;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      updateData.updatedBy = actor.userId;

      const plan = await tx.feePlan.update({
        where: { id },
        data: updateData,
        include: { instalments: { orderBy: { displayOrder: "asc" } } },
      });

      if (instalments) {
        await tx.feePlanInstallment.deleteMany({ where: { feePlanId: id } });

        if (instalments.length > 0) {
          await tx.feePlanInstallment.createMany({
            data: instalments.map((inst) => ({
              feePlanId: id,
              label: inst.label,
              dueOffsetDays: inst.dueOffsetDays ?? null,
              dueDate: inst.dueDate ? new Date(`${inst.dueDate}T00:00:00.000Z`) : null,
              amount: new Prisma.Decimal(inst.amount),
              displayOrder: inst.displayOrder,
            })),
          });

          plan.instalments = await tx.feePlanInstallment.findMany({
            where: { feePlanId: id },
            orderBy: { displayOrder: "asc" },
          });
        }
      }

      await createAuditLog(tx, actor, {
        action: "FEE_PLAN_UPDATE",
        entityType: "FeePlan",
        entityId: id,
        summary: `Updated fee plan: ${plan.name}`,
        metadata: { name: plan.name },
      });

      return plan as FeePlanWithInstallments;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A fee plan with these details already exists.",
      );
    }
    throw error;
  }
}

export async function archiveFeePlan(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.feePlan.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Fee plan not found.");
    }
    if (existing.archivedAt) {
      return existing;
    }

    const plan = await tx.feePlan.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "FEE_PLAN_ARCHIVE",
      entityType: "FeePlan",
      entityId: id,
      summary: `Archived fee plan: ${existing.name}`,
    });

    return plan;
  });
}

export async function restoreFeePlan(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.feePlan.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Fee plan not found.");
    }
    if (!existing.archivedAt) {
      return existing;
    }

    const plan = await tx.feePlan.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "FEE_PLAN_RESTORE",
      entityType: "FeePlan",
      entityId: id,
      summary: `Restored fee plan: ${existing.name}`,
    });

    return plan;
  });
}
