import { Prisma } from "@prisma/client";
import { ActorContext } from "./actor";

export type TransactionClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

function deepSanitize(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepSanitize);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret")
    ) {
      continue; // Strip sensitive key completely
    }
    sanitized[key] = deepSanitize(value);
  }
  return sanitized;
}

export async function createAuditLog(
  tx: TransactionClient,
  actor: ActorContext,
  params: {
    action: string;
    entityType: string;
    entityId?: string;
    summary: string;
    metadata?: Record<string, unknown>;
  },
) {
  const sanitizedMetadata = params.metadata
    ? (deepSanitize(params.metadata) as Record<string, unknown>)
    : {};

  return tx.auditLog.create({
    data: {
      actorUserId: actor.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      summary: params.summary,
      metadata: {
        ...sanitizedMetadata,
        actorSnapshot: actor.metadata,
      } as Prisma.InputJsonValue,
    },
  });
}
