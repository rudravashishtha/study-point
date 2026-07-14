"use server";


import {
  activateSession,
  archiveSession,
  createSession,
  restoreSession,
  updateSession,
} from "@/server/services/academic-sessions";
import {
  SessionCreateSchema,
  SessionUpdateSchema,
} from "@/lib/validation/academic-sessions";
import {
  withActor,
  withAuthorization,
  withRevalidation,
} from "@/lib/actions/wrappers";

export const createSessionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/academic-sessions", "/", "/courses"],
      async (actor, data: unknown) => {
        const parsed = SessionCreateSchema.parse(data);
        await createSession(actor, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);

export const updateSessionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/academic-sessions", "/", "/courses"],
      async (actor, id: string, data: unknown) => {
        const parsed = SessionUpdateSchema.parse(data);
        await updateSession(actor, id, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);

export const activateSessionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/academic-sessions", "/", "/courses"],
      async (actor, id: string) => {
        await activateSession(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);

export const archiveSessionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/academic-sessions", "/", "/courses"],
      async (actor, id: string) => {
        await archiveSession(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);

export const restoreSessionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/academic-sessions", "/", "/courses"],
      async (actor, id: string) => {
        await restoreSession(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);
