"use server";

import { inviteStudent } from "@/server/services/provisioning";
import { rateLimit } from "@/lib/rate-limit";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const inviteStudentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/students/activate"],
      async (actor, studentId: string) => {
        const { success: inviteOk } = rateLimit(`invite:${actor.userId}`, 20, 60 * 60_000);
        if (!inviteOk) {
          return { success: false, error: "Too many invitations. Please try again later." };
        }
        await inviteStudent(actor, studentId);
        return { success: true, data: undefined };
      }
    )
  )
);

export const bulkInviteStudentsAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/students/activate"],
      async (actor, ids: string[]) => {
        const { success: inviteOk } = rateLimit(`invite:${actor.userId}`, 20, 60 * 60_000);
        if (!inviteOk) {
          return { success: false, error: "Too many invitations. Please try again later." };
        }
        let invited = 0;
        let failed = 0;
        for (const id of ids) {
          try {
            await inviteStudent(actor, id);
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
      }
    )
  )
);
