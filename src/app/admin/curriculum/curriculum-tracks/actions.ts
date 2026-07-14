"use server";

import {
  createTrack,
  updateTrack,
  archiveTrack,
  restoreTrack,
} from "@/server/services/curriculum/tracks";
import {
  createCurriculumTrackSchema,
  updateCurriculumTrackSchema,
} from "@/lib/validation/curriculum";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createTrackAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/curriculum/curriculum-tracks"],
      async (actor, data: unknown) => {
        const parsed = createCurriculumTrackSchema.parse(data);
        await createTrack(actor, {
          ...parsed,
          programmeId: parsed.programmeId ?? null,
        });
        return { success: true, data: undefined };
      }
    )
  )
);

export const updateTrackAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/curriculum/curriculum-tracks"],
      async (actor, id: string, data: unknown) => {
        const parsed = updateCurriculumTrackSchema.parse(data);
        await updateTrack(actor, id, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);

export const archiveTrackAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/curriculum/curriculum-tracks"],
      async (actor, id: string) => {
        await archiveTrack(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);

export const restoreTrackAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/curriculum/curriculum-tracks"],
      async (actor, id: string) => {
        await restoreTrack(actor, id);
        return { success: true, data: undefined };
      }
    )
  )
);
