"use server";

import { revalidatePath } from "next/cache";
import {
  createLiveClassSession,
  updateLiveClassSession,
  cancelLiveClassSession,
} from "@/server/services/live-classes";
import {
  CreateLiveClassSessionInput,
  UpdateLiveClassSessionInput,
} from "@/lib/validation/live-classes";
import { requireAuth } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

async function getActor() {
  const sessionUser = await requireAuth();
  if (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.TEACHER) {
    throw new Error("Unauthorized");
  }
  let teacherId = null;
  if (sessionUser.role === Role.TEACHER) {
    const user = await db.appUser.findUnique({ where: { id: sessionUser.id } });
    teacherId = user?.teacherId || null;
  }
  return { id: sessionUser.id, role: sessionUser.role, teacherId };
}

export async function createLiveClassAction(input: CreateLiveClassSessionInput) {
  const actor = await getActor();
  const result = await createLiveClassSession(input, actor);

  if (result.success) {
    revalidatePath("/admin/live-classes");
    revalidatePath("/teacher/agenda");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/timetable");
  }

  return result;
}

export async function updateLiveClassAction(
  id: string,
  input: Partial<UpdateLiveClassSessionInput>,
) {
  const actor = await getActor();
  const result = await updateLiveClassSession(id, input, actor);

  if (result.success) {
    revalidatePath("/admin/live-classes");
    revalidatePath("/teacher/agenda");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/timetable");
  }

  return result;
}

export async function cancelLiveClassAction(id: string) {
  const actor = await getActor();
  const result = await cancelLiveClassSession(id, actor);

  if (result.success) {
    revalidatePath("/admin/live-classes");
    revalidatePath("/teacher/agenda");
    revalidatePath("/student/dashboard");
    revalidatePath("/student/timetable");
  }

  return result;
}
