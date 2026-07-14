"use server";

import {
  createStudyMaterial,
  updateStudyMaterial,
  publishStudyMaterial,
  archiveStudyMaterial,
  CreateStudyMaterialInput,
  UpdateStudyMaterialInput,
} from "@/server/services/study-materials";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError } from "@/lib/domain/errors";

export const createAdminMaterialAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/materials", "/resources", "/"],
      async (actor, input: CreateStudyMaterialInput) => {
        const res = await createStudyMaterial(actor.userId, input);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to create material");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const updateAdminMaterialAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/materials", "/resources", "/"],
      async (actor, id: string, input: UpdateStudyMaterialInput) => {
        const res = await updateStudyMaterial(actor.userId, id, input);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to update material");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const publishAdminMaterialAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/materials", "/resources", "/"],
      async (actor, id: string) => {
        const res = await publishStudyMaterial(actor.userId, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to publish material");
        }
        return { success: true, data: res.data };
      }
    )
  )
);

export const archiveAdminMaterialAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      () => ["/admin/materials", "/resources", "/"],
      async (actor, id: string) => {
        const res = await archiveStudyMaterial(actor.userId, id);
        if (!res.success) {
          throw new DomainError((res.error?.code as any) || "INTERNAL_ERROR", res.error?.message || "Failed to archive material");
        }
        return { success: true, data: res.data };
      }
    )
  )
);
