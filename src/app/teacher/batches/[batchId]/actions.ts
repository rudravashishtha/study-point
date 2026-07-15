"use server";

import { requireTeacherPermission } from "@/server/auth/teacher";
import {
  createStudyMaterial,
  updateStudyMaterial,
  publishStudyMaterial,
  archiveStudyMaterial,
  CreateStudyMaterialInput,
  UpdateStudyMaterialInput,
} from "@/server/services/study-materials";
import { db } from "@/lib/db";
import {
  createHomework,
  updateHomework,
  publishHomework,
  archiveHomework,
  CreateHomeworkInput,
  UpdateHomeworkInput,
} from "@/server/services/homework";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";
import { DomainError } from "@/lib/domain/errors";

export const createTeacherHomeworkAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, input: Omit<CreateHomeworkInput, "batchId">) => {
        await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");

        const payload: CreateHomeworkInput = {
          ...input,
          batchId,
        };

        await createHomework(actor.userId, payload);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const updateTeacherHomeworkAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, id: string, input: UpdateHomeworkInput) => {
        await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");
        await updateHomework(actor.userId, id, input);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const publishTeacherHomeworkAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, id: string) => {
        await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");
        await publishHomework(actor.userId, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const archiveTeacherHomeworkAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, id: string) => {
        await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");
        await archiveHomework(actor.userId, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const createTeacherMaterialAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (
        actor,
        batchId: string,
        input: Omit<
          CreateStudyMaterialInput,
          "visibility" | "batchId" | "academicSessionId" | "curriculumTrackId"
        >,
      ) => {
        await requireTeacherPermission(batchId, "MATERIALS_MANAGE");

        const batch = await db.batch.findUnique({
          where: { id: batchId },
          select: { academicSessionId: true, curriculumTrackId: true },
        });
        if (!batch) {
          throw new DomainError("NOT_FOUND", "Batch not found");
        }

        const payload: CreateStudyMaterialInput = {
          ...input,
          visibility: "BATCH",
          batchId,
          academicSessionId: batch.academicSessionId,
          curriculumTrackId: batch.curriculumTrackId,
        };

        await createStudyMaterial(actor.userId, payload);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const updateTeacherMaterialAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (
        actor,
        batchId: string,
        id: string,
        input: Omit<
          UpdateStudyMaterialInput,
          "visibility" | "batchId" | "academicSessionId" | "curriculumTrackId"
        >,
      ) => {
        await requireTeacherPermission(batchId, "MATERIALS_MANAGE");

        await updateStudyMaterial(actor.userId, id, input);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const publishTeacherMaterialAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, id: string) => {
        await requireTeacherPermission(batchId, "MATERIALS_MANAGE");
        await publishStudyMaterial(actor.userId, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);

export const archiveTeacherMaterialAction = withActor(
  withAuthorization(
    "TEACHER",
    withRevalidation(
      (_actor, batchId) => [`/teacher/batches/${batchId}`],
      async (actor, batchId: string, id: string) => {
        await requireTeacherPermission(batchId, "MATERIALS_MANAGE");
        await archiveStudyMaterial(actor.userId, id);
        return { success: true, data: undefined };
      },
    ),
  ),
);
