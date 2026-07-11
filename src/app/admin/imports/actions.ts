"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { listImportJobs, getImportJob, getImportErrors } from "@/server/services/imports";
import { ImportType } from "@prisma/client";

export async function listImportJobsAction(params: {
  page?: number;
  pageSize?: number;
  importType?: ImportType;
}) {
  await requireAdmin();
  return listImportJobs(params, "");
}

export async function getImportJobAction(jobId: string) {
  await requireAdmin();
  return getImportJob(jobId, "");
}

export async function getImportErrorsAction(jobId: string) {
  await requireAdmin();
  return getImportErrors(jobId, "");
}
