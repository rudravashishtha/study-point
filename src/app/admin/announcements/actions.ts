"use server";

import {
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
} from "@/server/services/announcements";
import {
  AnnouncementCreateSchema,
  AnnouncementUpdateSchema,
} from "@/lib/validation/announcements";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createAnnouncementAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/announcements", "/announcements", "/"],
      async (actor, data: unknown) => {
        const parsed = AnnouncementCreateSchema.parse(data);
        await createAnnouncement(actor, parsed);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const updateAnnouncementAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/announcements", "/announcements", "/"],
      async (actor, id: string, data: unknown) => {
        const parsed = AnnouncementUpdateSchema.parse(data);
        await updateAnnouncement(actor, id, parsed);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const publishAnnouncementAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/announcements", "/announcements", "/"],
      async (actor, id: string) => {
        await publishAnnouncement(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const archiveAnnouncementAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/announcements", "/announcements", "/"],
      async (actor, id: string) => {
        await archiveAnnouncement(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const restoreAnnouncementAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/announcements", "/announcements", "/"],
      async (actor, id: string) => {
        await restoreAnnouncement(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);
