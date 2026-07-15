import { revalidatePath } from "next/cache";
import { ActorContext } from "@/lib/domain/actor";
import type { ActionResult } from "@/lib/actions/types";
import { handleActionError } from "@/lib/actions/errors";
import { requireAppUser } from "@/lib/auth/permissions";
import { DomainError } from "@/lib/domain/errors";

export async function getActor(): Promise<ActorContext> {
  const appUser = await requireAppUser();
  return {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };
}

/**
 * Injects the actor context and catches/maps all domain errors.
 * This is the outer-most wrapper. It does NOT enforce role boundaries (beyond standard auth).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Justified: any[] is the only sound generic bound for function arguments in TypeScript (unknown[] breaks contravariant inference).
export function withActor<Args extends any[], Return>(
  action: (actor: ActorContext, ...args: Args) => Promise<ActionResult<Return>>
): (...args: Args) => Promise<ActionResult<Return>> {
  return async (...args: Args) => {
    try {
      const actor = await getActor();
      return await action(actor, ...args);
    } catch (error) {
      return handleActionError(error);
    }
  };
}

/**
 * Asserts authorization before passing to the action.
 * Throws a DomainError if the actor lacks the specified role.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Justified: any[] is required to preserve argument inference for HOFs.
export function withAuthorization<Args extends any[], Return>(
  role: "ADMIN" | "TEACHER" | "STUDENT",
  action: (actor: ActorContext, ...args: Args) => Promise<ActionResult<Return>>
): (actor: ActorContext, ...args: Args) => Promise<ActionResult<Return>> {
  return async (actor, ...args) => {
    if (actor.role !== role) {
      throw new DomainError("UNAUTHORIZED", "Unauthorized: Insufficient permissions.");
    }
    return action(actor, ...args);
  };
}

/**
 * Automatically triggers Next.js path revalidation upon a successful action result.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Justified: any[] is required to preserve argument inference for HOFs.
export function withRevalidation<Args extends any[], Return>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Justified: needed to prevent inference collision with Args.
  pathsOrGetPaths: string[] | ((actor: ActorContext, ...args: any[]) => string[]),
  action: (actor: ActorContext, ...args: Args) => Promise<ActionResult<Return>>
): (actor: ActorContext, ...args: Args) => Promise<ActionResult<Return>> {
  return async (actor, ...args) => {
    const result = await action(actor, ...args);
    if (result.success) {
      const paths =
        typeof pathsOrGetPaths === "function"
          ? pathsOrGetPaths(actor, ...args)
          : pathsOrGetPaths;
      paths.forEach((p) => {
        if (p === "/") {
          revalidatePath("/", "layout");
        } else {
          revalidatePath(p, "page");
        }
      });
    }
    return result;
  };
}
