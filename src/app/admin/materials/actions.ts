"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import {
  createStudyMaterial,
  updateStudyMaterial,
  publishStudyMaterial,
  archiveStudyMaterial,
  CreateStudyMaterialInput,
  UpdateStudyMaterialInput,
} from "@/server/services/study-materials";
import { revalidatePath } from "next/cache";

export async function createAdminMaterialAction(input: CreateStudyMaterialInput) {
  const admin = await requireAdmin();
  const res = await createStudyMaterial(admin.id, input);
  if (res.success) {
    revalidatePath("/admin/materials");
  }
  return res;
}

export async function updateAdminMaterialAction(
  id: string,
  input: UpdateStudyMaterialInput,
) {
  const admin = await requireAdmin();
  const res = await updateStudyMaterial(admin.id, id, input);
  if (res.success) {
    revalidatePath("/admin/materials");
  }
  return res;
}

export async function publishAdminMaterialAction(id: string) {
  const admin = await requireAdmin();
  const res = await publishStudyMaterial(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/materials");
  }
  return res;
}

export async function archiveAdminMaterialAction(id: string) {
  const admin = await requireAdmin();
  const res = await archiveStudyMaterial(admin.id, id);
  if (res.success) {
    revalidatePath("/admin/materials");
  }
  return res;
}
