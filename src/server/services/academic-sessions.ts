import { db } from "../../lib/db";
import { isConcurrencyConflict } from "../../lib/db/errors";
import { Prisma } from "@prisma/client";
import { ActorContext } from "../../lib/domain/actor";
import { createAuditLog } from "../../lib/domain/audit";
import { DomainError } from "../../lib/domain/errors";

export async function listAcademicSessions(params: {
  page: number;
  pageSize: number;
  archiveState: "active" | "archived" | "all";
  query: string;
  sortField: "createdAt" | "name" | "startsOn" | "endsOn";
  sortDir: "asc" | "desc";
}) {
  const where: Prisma.AcademicSessionWhereInput = {};
  if (params.archiveState === "active") {
    where.archivedAt = null;
  } else if (params.archiveState === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.query) {
    where.name = { contains: params.query, mode: "insensitive" };
  }

  const [data, total] = await Promise.all([
    db.academicSession.findMany({
      where,
      orderBy: { [params.sortField]: params.sortDir },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    db.academicSession.count({ where }),
  ]);

  return { data, total };
}

export async function createSession(
  actor: ActorContext,
  data: { name: string; startsOn?: Date | null; endsOn?: Date | null },
) {
  try {
    return await db.$transaction(async (tx) => {
      const session = await tx.academicSession.create({
        data: {
          name: data.name,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          createdBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "CREATE",
        entityType: "AcademicSession",
        entityId: session.id,
        summary: `Created academic session: ${session.name}`,
        metadata: { name: session.name },
      });

      return session;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta?.target.includes("name")
    ) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A session with this name already exists.",
      );
    }
    throw error;
  }
}

export async function updateSession(
  actor: ActorContext,
  id: string,
  data: { name: string; startsOn?: Date | null; endsOn?: Date | null },
) {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.academicSession.findUnique({ where: { id } });
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Academic session not found.");
      }
      if (existing.archivedAt) {
        throw new DomainError("INVALID_LIFECYCLE", "Cannot update an archived session.");
      }

      // Skip update if no fields changed
      if (
        existing.name === data.name &&
        existing.startsOn?.getTime() === data.startsOn?.getTime() &&
        existing.endsOn?.getTime() === data.endsOn?.getTime()
      ) {
        return existing;
      }

      const session = await tx.academicSession.update({
        where: { id },
        data: {
          name: data.name,
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          updatedBy: actor.userId,
        },
      });

      await createAuditLog(tx, actor, {
        action: "UPDATE",
        entityType: "AcademicSession",
        entityId: session.id,
        summary: `Updated academic session: ${session.name}`,
        metadata: {
          previousValues: {
            name: existing.name,
            startsOn: existing.startsOn,
            endsOn: existing.endsOn,
          },
        },
      });

      return session;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      Array.isArray(error.meta?.target) &&
      error.meta?.target.includes("name")
    ) {
      throw new DomainError(
        "DUPLICATE_IDENTITY",
        "A session with this name already exists.",
      );
    }
    throw error;
  }
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function activateSession(actor: ActorContext, id: string) {
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      return await db.$transaction(
        async (tx) => {
          const target = await tx.academicSession.findUnique({ where: { id } });
          if (!target) {
            throw new DomainError("NOT_FOUND", "Academic session not found.");
          }

          if (target.isActive) {
            // No-op
            return target;
          }

          if (target.archivedAt) {
            throw new DomainError(
              "INVALID_LIFECYCLE",
              "Cannot activate an archived session. Restore it first.",
            );
          }

          const currentlyActive = await tx.academicSession.findFirst({
            where: { isActive: true },
          });

          if (currentlyActive) {
            await tx.academicSession.update({
              where: { id: currentlyActive.id },
              data: {
                isActive: false,
                updatedBy: actor.userId,
              },
            });

            await createAuditLog(tx, actor, {
              action: "DEACTIVATE",
              entityType: "AcademicSession",
              entityId: currentlyActive.id,
              summary: `Deactivated academic session: ${currentlyActive.name}`,
            });
          }

          const activated = await tx.academicSession.update({
            where: { id: target.id },
            data: {
              isActive: true,
              updatedBy: actor.userId,
            },
          });

          await createAuditLog(tx, actor, {
            action: "ACTIVATE",
            entityType: "AcademicSession",
            entityId: activated.id,
            summary: `Activated academic session: ${activated.name}`,
          });

          return activated;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (isConcurrencyConflict(error)) {
        attempt++;
        if (attempt >= maxAttempts) {
          throw new DomainError(
            "CONCURRENT_UPDATE",
            "Failed to activate session due to high concurrency. Please try again.",
          );
        }
        // Exponential backoff with jitter
        const backoffMs = Math.pow(2, attempt) * 50 + Math.random() * 50;
        await delay(backoffMs);
        continue;
      }
      throw error;
    }
  }
  throw new DomainError(
    "CONCURRENT_UPDATE",
    "Failed to activate session due to high concurrency. Please try again.",
  );
}

export async function archiveSession(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.academicSession.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Academic session not found.");
    }
    if (existing.isActive) {
      throw new DomainError(
        "INVALID_LIFECYCLE",
        "Cannot archive an active session. Deactivate it first.",
      );
    }
    if (existing.archivedAt) {
      return existing; // Already archived
    }

    const session = await tx.academicSession.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "ARCHIVE",
      entityType: "AcademicSession",
      entityId: session.id,
      summary: `Archived academic session: ${session.name}`,
    });

    return session;
  });
}

export async function restoreSession(actor: ActorContext, id: string) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.academicSession.findUnique({ where: { id } });
    if (!existing) {
      throw new DomainError("NOT_FOUND", "Academic session not found.");
    }
    if (!existing.archivedAt) {
      return existing; // Already active
    }

    const session = await tx.academicSession.update({
      where: { id },
      data: {
        archivedAt: null,
        archivedBy: null,
        updatedBy: actor.userId,
      },
    });

    await createAuditLog(tx, actor, {
      action: "RESTORE",
      entityType: "AcademicSession",
      entityId: session.id,
      summary: `Restored academic session: ${session.name}`,
    });

    return session;
  });
}
