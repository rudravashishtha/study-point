"use server";

import { inviteTeacher, resetTeacherInvitation } from "@/server/services/provisioning";
import { rateLimit } from "@/lib/rate-limit";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const inviteTeacherFromQueueAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/teachers/activate", "/admin/teachers"],
      async (actor, teacherId: string) => {
        const { success: inviteOk } = rateLimit(
          `invite-teacher:${actor.userId}`,
          20,
          60 * 60_000,
        );
        if (!inviteOk) {
          return {
            success: false,
            error: "Too many invitations. Please try again later.",
          };
        }
        await inviteTeacher(actor, teacherId);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const bulkInviteTeachersAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/teachers/activate", "/admin/teachers"],
      async (actor, ids: string[]) => {
        const { success: inviteOk } = rateLimit(
          `invite-teacher:${actor.userId}`,
          20,
          60 * 60_000,
        );
        if (!inviteOk) {
          return {
            success: false,
            error: "Too many invitations. Please try again later.",
          };
        }
        let invited = 0;
        let failed = 0;
        for (const id of ids) {
          try {
            await inviteTeacher(actor, id);
            invited += 1;
          } catch {
            failed += 1;
          }
        }
        if (failed > 0) {
          return {
            success: false,
            error: `Invited ${invited} of ${ids.length}; ${failed} failed.`,
          };
        }
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const resetTeacherInvitationAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/teachers/activate", "/admin/teachers"],
      async (actor, teacherId: string) => {
        await resetTeacherInvitation(actor, teacherId);
        return { success: true, data: undefined };
      },
    ),
  ),
);
