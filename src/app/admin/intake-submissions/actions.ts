"use server";

import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import {
  convertSubmissionToStudent,
  rejectSubmission,
  updateSubmissionReview,
} from "@/server/services/student-intake";
import {
  convertSubmissionSchema,
  rejectSubmissionSchema,
  updateSubmissionReviewSchema,
} from "@/lib/validation/student-intake";

const revalidateTargets = ["/admin/intake-submissions", "/admin/students"];

export const updateSubmissionReviewAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(revalidateTargets, async (actor, data: unknown) => {
      const parsed = updateSubmissionReviewSchema.parse(data);
      const result = await updateSubmissionReview(parsed, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: undefined };
    }),
  ),
);

export const rejectSubmissionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(revalidateTargets, async (actor, data: unknown) => {
      const parsed = rejectSubmissionSchema.parse(data);
      const result = await rejectSubmission(parsed, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: undefined };
    }),
  ),
);

export const convertSubmissionAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(revalidateTargets, async (actor, data: unknown) => {
      const parsed = convertSubmissionSchema.parse(data);
      const result = await convertSubmissionToStudent(parsed, actor);
      if (!result.success) return { success: false, error: result.error.message };
      return { success: true, data: result.data };
    }),
  ),
);
