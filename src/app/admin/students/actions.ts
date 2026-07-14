"use server";

import {
  createStudent,
  updateStudent,
  archiveStudent,
  restoreStudent,
  createStudentSchema,
  updateStudentSchema,
} from "@/server/services/students";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createStudentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/students"],
      async (actor, data: unknown) => {
        const parsed = createStudentSchema.parse(data);
        await createStudent(parsed, actor.userId);
        return { success: true, data: undefined };
      }
    )
  )
);

export const updateStudentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/students"],
      async (actor, id: string, data: unknown) => {
        const parsed = updateStudentSchema.parse({
          id,
          ...(data as Record<string, unknown>),
        });
        await updateStudent(parsed, actor.userId);
        return { success: true, data: undefined };
      }
    )
  )
);

export const archiveStudentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/students"],
      async (actor, id: string) => {
        await archiveStudent(id, actor.userId);
        return { success: true, data: undefined };
      }
    )
  )
);

export const restoreStudentAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/students"],
      async (actor, id: string) => {
        await restoreStudent(id, actor.userId);
        return { success: true, data: undefined };
      }
    )
  )
);
