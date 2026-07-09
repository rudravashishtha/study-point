import { db } from "../../lib/db";
import { getAppUser } from "../../lib/auth/permissions";
import { PermissionCapability, Role } from "@prisma/client";
import { resolveEffectivePermissions } from "../../lib/domain/permissions";

export interface TeacherContext {
  batchId: string;
  isAuthorized: boolean;
  isAdmin: boolean;
  storedPermissions: PermissionCapability[];
  effectivePermissions: PermissionCapability[];
}

/**
 * Server-derived context for Teacher UI rendering.
 * Does not throw authorization errors.
 */
export async function getTeacherContext(batchId: string): Promise<TeacherContext> {
  const appUser = await getAppUser();

  const fallback: TeacherContext = {
    batchId,
    isAuthorized: false,
    isAdmin: false,
    storedPermissions: [],
    effectivePermissions: [],
  };

  if (!appUser || appUser.status !== "ACTIVE") {
    return fallback;
  }

  if (appUser.role === Role.ADMIN) {
    // Admin is superuser
    return {
      batchId,
      isAuthorized: true,
      isAdmin: true,
      storedPermissions: [],
      effectivePermissions: [],
    };
  }

  if (appUser.role !== Role.TEACHER || !appUser.teacherId) {
    return fallback;
  }

  // Validate the Batch exists and is not archived
  const batch = await db.batch.findUnique({
    where: { id: batchId },
    select: { archivedAt: true },
  });

  if (!batch || batch.archivedAt !== null) {
    return fallback;
  }

  // Find the exact Teacher profile to ensure it is active
  const teacher = await db.teacher.findUnique({
    where: { id: appUser.teacherId },
    select: { active: true },
  });

  if (!teacher || !teacher.active) {
    return fallback;
  }

  // Find the active assignment
  const assignment = await db.teacherAssignment.findFirst({
    where: {
      teacherId: appUser.teacherId,
      batchId,
      archivedAt: null,
    },
    select: {
      permissions: true,
      archivedAt: true,
    },
  });

  if (!assignment || assignment.archivedAt !== null) {
    return fallback;
  }

  const effective = resolveEffectivePermissions(assignment.permissions);

  return {
    batchId,
    isAuthorized: true,
    isAdmin: false,
    storedPermissions: assignment.permissions,
    effectivePermissions: effective,
  };
}

/**
 * Authorization guard. Throws if not authorized.
 */
export async function requireTeacherPermission(
  batchId: string,
  capability: PermissionCapability,
): Promise<void> {
  const context = await getTeacherContext(batchId);

  if (!context.isAuthorized) {
    throw new Error("Unauthorized");
  }

  // Admin bypass
  if (context.isAdmin) {
    return;
  }

  // Check if capability is in effective permissions
  if (!context.effectivePermissions.includes(capability)) {
    throw new Error(`Forbidden: missing capability ${capability}`);
  }
}
