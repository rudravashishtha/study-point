"use server";

import { publicEnv } from "@/lib/env";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import {
  archiveIntakeLink,
  createIntakeLink,
  deleteArchivedIntakeLink,
  deactivateIntakeLink,
} from "@/server/services/student-intake";
import { createIntakeLinkSchema } from "@/lib/validation/student-intake";

export const createIntakeLinkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/intake-links"], async (actor, data: unknown) => {
      const parsed = createIntakeLinkSchema.parse(data);
      const result = await createIntakeLink(parsed, actor);
      if (!result.success) return { success: false, error: result.error.message };

      const url = new URL(`/intake/${result.data.rawToken}`, publicEnv.NEXT_PUBLIC_APP_URL);
      return {
        success: true,
        data: { id: result.data.id, url: url.toString() },
      };
    }),
  ),
);

export const deactivateIntakeLinkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/intake-links"], async (actor, id: string) => {
      const result = await deactivateIntakeLink(id, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: undefined };
    }),
  ),
);

export const archiveIntakeLinkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/intake-links"], async (actor, id: string) => {
      const result = await archiveIntakeLink(id, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: undefined };
    }),
  ),
);

export const deleteArchivedIntakeLinkAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(["/admin/intake-links"], async (actor, id: string) => {
      const result = await deleteArchivedIntakeLink(id, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: undefined };
    }),
  ),
);
