"use server";

import {
  createTeacher,
  updateTeacher,
  archiveTeacher,
  restoreTeacher,
  CreateTeacherParams,
  UpdateTeacherParams,
} from "@/server/services/teachers";
import { inviteTeacher } from "@/server/services/provisioning";
import { createTeacherSchema, updateTeacherSchema } from "@/lib/validation/teachers";
import { DomainError } from "@/lib/domain/errors";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const createTeacherAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/teachers", "/", "/about"],
      async (actor, data: CreateTeacherParams) => {
        const parsed = createTeacherSchema.parse(data);
        const result = await createTeacher(actor, parsed);
        if (result.type !== "SUCCESS") {
          throw new DomainError("INTERNAL_ERROR", "Failed to create teacher");
        }
        return { success: true, data: { teacherId: result.data.id } };
      },
    ),
  ),
);

export const updateTeacherAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/teachers", `/admin/teachers/${id}`, "/", "/about"],
      async (actor, id: string, data: UpdateTeacherParams) => {
        const parsed = updateTeacherSchema.parse(data);
        const result = await updateTeacher(actor, id, parsed);

        if (result.type === "NOT_FOUND") {
          throw new DomainError("NOT_FOUND", "Teacher not found");
        }

        if (result.type === "INVALID_LIFECYCLE") {
          throw new DomainError(
            "INVALID_LIFECYCLE",
            result.reason || "Invalid lifecycle state",
          );
        }

        return { success: true, data: undefined };
      },
    ),
  ),
);

export const archiveTeacherAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/teachers", `/admin/teachers/${id}`, "/", "/about"],
      async (actor, id: string) => {
        const result = await archiveTeacher(actor, id);
        if (result.type === "ARCHIVE_BLOCKED") {
          throw new DomainError(
            "ARCHIVE_BLOCKED",
            "Cannot deactivate teacher with active batch assignments. Remove them from active batches first.",
          );
        }
        if (result.type === "INVALID_LIFECYCLE") {
          throw new DomainError("INVALID_LIFECYCLE", "Cannot deactivate this teacher");
        }
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const restoreTeacherAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/teachers", `/admin/teachers/${id}`, "/", "/about"],
      async (actor, id: string) => {
        const result = await restoreTeacher(actor, id);
        if (result.type !== "SUCCESS") {
          throw new DomainError("INVALID_LIFECYCLE", "Cannot reactivate this teacher");
        }
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const inviteTeacherAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      (_actor, id) => ["/admin/teachers", `/admin/teachers/${id}`],
      async (actor, id: string) => {
        await inviteTeacher(actor, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);
