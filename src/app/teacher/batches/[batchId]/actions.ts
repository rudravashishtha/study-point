"use server";

import { requireAppUser } from "@/lib/auth/permissions";
import { requireTeacherPermission } from "@/server/auth/teacher";
import {
  createStudyMaterial,
  updateStudyMaterial,
  publishStudyMaterial,
  archiveStudyMaterial,
  CreateStudyMaterialInput,
  UpdateStudyMaterialInput,
} from "@/server/services/study-materials";
import {
  createHomework,
  updateHomework,
  publishHomework,
  archiveHomework,
  CreateHomeworkInput,
  UpdateHomeworkInput,
} from "@/server/services/homework";
import { revalidatePath } from "next/cache";

export async function createTeacherHomeworkAction(
  batchId: string,
  input: Omit<CreateHomeworkInput, "batchId">,
) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");

  const payload: CreateHomeworkInput = {
    ...input,
    batchId,
  };

  const res = await createHomework(user.id, payload);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function updateTeacherHomeworkAction(
  batchId: string,
  id: string,
  input: UpdateHomeworkInput,
) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");

  const res = await updateHomework(user.id, id, input);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function publishTeacherHomeworkAction(batchId: string, id: string) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");
  const res = await publishHomework(user.id, id);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function archiveTeacherHomeworkAction(batchId: string, id: string) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "HOMEWORK_MANAGE");
  const res = await archiveHomework(user.id, id);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function createTeacherMaterialAction(
  batchId: string,
  input: Omit<CreateStudyMaterialInput, "visibility" | "batchId">,
) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "MATERIALS_MANAGE");

  const payload: CreateStudyMaterialInput = {
    ...input,
    visibility: "BATCH",
    batchId,
  };

  const res = await createStudyMaterial(user.id, payload);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function updateTeacherMaterialAction(
  batchId: string,
  id: string,
  input: Omit<UpdateStudyMaterialInput, "visibility" | "batchId">,
) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "MATERIALS_MANAGE");

  // We do not allow changing visibility or batchId
  const res = await updateStudyMaterial(user.id, id, input);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function publishTeacherMaterialAction(batchId: string, id: string) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "MATERIALS_MANAGE");
  const res = await publishStudyMaterial(user.id, id);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}

export async function archiveTeacherMaterialAction(batchId: string, id: string) {
  const user = await requireAppUser();
  await requireTeacherPermission(batchId, "MATERIALS_MANAGE");
  const res = await archiveStudyMaterial(user.id, id);
  if (res.success) {
    revalidatePath(`/teacher/batches/${batchId}`);
  }
  return res;
}
