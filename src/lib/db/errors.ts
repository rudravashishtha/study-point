import { Prisma } from "@prisma/client";

export function extractPrismaUniqueFields(error: unknown): string[] | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2002") return null;

  // Standard Prisma engine shape
  if (Array.isArray(error.meta?.target)) {
    return error.meta.target as string[];
  }

  // @prisma/adapter-pg shape
  const pgCause = (error.meta?.driverAdapterError as Record<string, unknown>)?.cause as
    Record<string, unknown> | undefined;
  const constraint = pgCause?.constraint as Record<string, unknown> | undefined;
  const fields = constraint?.fields;
  if (Array.isArray(fields)) {
    // Adapter returns fields like '"boardId"' - strip the double quotes
    return fields.map((f: unknown) =>
      typeof f === "string" ? f.replace(/^"|"$/g, "") : String(f),
    );
  }

  return null;
}

export function matchUniqueFields(actual: string[] | null, expected: string[]): boolean {
  if (!actual || actual.length !== expected.length) return false;
  // Order-independent exact match
  const sortedActual = [...actual].sort();
  const sortedExpected = [...expected].sort();
  return sortedActual.every((val, index) => val === sortedExpected[index]);
}

export function extractPrismaConstraintName(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2002") return null;

  // Try to get constraint name from driverAdapterError
  const pgCause = (error.meta?.driverAdapterError as Record<string, unknown>)?.cause as
    Record<string, unknown> | undefined;

  if (
    pgCause?.constraint &&
    typeof pgCause.constraint === "object" &&
    "name" in pgCause.constraint &&
    typeof pgCause.constraint.name === "string"
  ) {
    return pgCause.constraint.name;
  }

  // Fallback to searching the originalMessage
  const originalMsg = pgCause?.originalMessage || error.message;
  if (typeof originalMsg === "string") {
    // Just check if it mentions the name
    const match = originalMsg.match(/"([^"]+_key)"/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export function isConcurrencyConflict(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2034") return true;

    // Check adapter error cause for Postgres 40P01
    const pgCause = (error.meta?.driverAdapterError as Record<string, unknown>)?.cause as
      Record<string, unknown> | undefined;
    if (pgCause?.originalCode === "40P01" || pgCause?.code === "40P01") {
      return true;
    }
  }

  // Handle generic unwrapped errors or PrismaClientUnknownRequestError containing 'cause'
  if (error && typeof error === "object") {
    const cause = (error as any).cause;
    if (cause && (cause.originalCode === "40P01" || cause.code === "40P01")) {
      return true;
    }
    if ((error as any).code === "40P01" || (error as any).originalCode === "40P01") {
      return true;
    }
  }

  return false;
}
