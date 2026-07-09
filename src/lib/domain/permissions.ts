import { PermissionCapability } from "@prisma/client";

export const TEACHER_PERMISSION_PRESETS = [
  {
    name: "View Only",
    permissions: [
      "BATCH_VIEW",
      "MEMBERS_VIEW",
      "ATTENDANCE_VIEW",
      "CURRICULUM_PROGRESS_VIEW",
      "MATERIALS_VIEW",
      "HOMEWORK_VIEW",
      "QUESTION_BANK_VIEW",
      "TESTS_VIEW",
      "RESULTS_VIEW",
      "FEES_VIEW",
      "SCHEDULE_VIEW",
      "ANNOUNCEMENTS_VIEW",
    ] as PermissionCapability[],
  },
  {
    name: "Teaching",
    permissions: [
      "BATCH_VIEW",
      "MEMBERS_VIEW",
      "ATTENDANCE_MANAGE",
      "CURRICULUM_PROGRESS_MANAGE",
      "MATERIALS_VIEW",
      "HOMEWORK_MANAGE",
      "TESTS_VIEW",
      "RESULTS_MANAGE",
      "SCHEDULE_VIEW",
      "ANNOUNCEMENTS_VIEW",
    ] as PermissionCapability[],
  },
  {
    name: "Academic Manager",
    permissions: [
      "BATCH_VIEW",
      "MEMBERS_MANAGE",
      "ATTENDANCE_MANAGE",
      "CURRICULUM_PROGRESS_MANAGE",
      "MATERIALS_MANAGE",
      "HOMEWORK_MANAGE",
      "QUESTION_BANK_MANAGE",
      "TESTS_MANAGE",
      "RESULTS_MANAGE",
      "SCHEDULE_MANAGE",
      "ANNOUNCEMENTS_MANAGE",
    ] as PermissionCapability[],
  },
  {
    name: "Full Batch Operations",
    permissions: [
      "BATCH_VIEW",
      "BATCH_MANAGE",
      "MEMBERS_VIEW",
      "MEMBERS_MANAGE",
      "ATTENDANCE_VIEW",
      "ATTENDANCE_MANAGE",
      "CURRICULUM_PROGRESS_VIEW",
      "CURRICULUM_PROGRESS_MANAGE",
      "MATERIALS_VIEW",
      "MATERIALS_MANAGE",
      "HOMEWORK_VIEW",
      "HOMEWORK_MANAGE",
      "QUESTION_BANK_VIEW",
      "QUESTION_BANK_MANAGE",
      "TESTS_VIEW",
      "TESTS_MANAGE",
      "RESULTS_VIEW",
      "RESULTS_MANAGE",
      "FEES_VIEW",
      "FEES_MANAGE",
      "PAYMENTS_RECORD",
      "SCHEDULE_VIEW",
      "SCHEDULE_MANAGE",
      "ANNOUNCEMENTS_VIEW",
      "ANNOUNCEMENTS_MANAGE",
    ] as PermissionCapability[],
  },
] as const;

/**
 * A pure function that calculates the effective permissions implied by explicitly
 * stored permissions.
 *
 * Implication rules:
 * - BATCH_MANAGE → BATCH_VIEW
 * - MEMBERS_MANAGE → MEMBERS_VIEW
 * - ATTENDANCE_MANAGE → ATTENDANCE_VIEW
 * - CURRICULUM_PROGRESS_MANAGE → CURRICULUM_PROGRESS_VIEW
 * - MATERIALS_MANAGE → MATERIALS_VIEW
 * - HOMEWORK_MANAGE → HOMEWORK_VIEW
 * - QUESTION_BANK_MANAGE → QUESTION_BANK_VIEW
 * - TESTS_MANAGE → TESTS_VIEW
 * - RESULTS_MANAGE → RESULTS_VIEW
 * - FEES_MANAGE → FEES_VIEW
 * - PAYMENTS_RECORD → FEES_VIEW
 * - SCHEDULE_MANAGE → SCHEDULE_VIEW
 * - ANNOUNCEMENTS_MANAGE → ANNOUNCEMENTS_VIEW
 *
 * This function does NOT mutate the original array.
 */
export function resolveEffectivePermissions(
  storedPermissions: PermissionCapability[] | null | undefined,
): PermissionCapability[] {
  if (!storedPermissions || storedPermissions.length === 0) {
    return [];
  }

  const effectiveSet = new Set<PermissionCapability>(storedPermissions);

  if (effectiveSet.has(PermissionCapability.BATCH_MANAGE)) {
    effectiveSet.add(PermissionCapability.BATCH_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.MEMBERS_MANAGE)) {
    effectiveSet.add(PermissionCapability.MEMBERS_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.ATTENDANCE_MANAGE)) {
    effectiveSet.add(PermissionCapability.ATTENDANCE_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.CURRICULUM_PROGRESS_MANAGE)) {
    effectiveSet.add(PermissionCapability.CURRICULUM_PROGRESS_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.MATERIALS_MANAGE)) {
    effectiveSet.add(PermissionCapability.MATERIALS_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.HOMEWORK_MANAGE)) {
    effectiveSet.add(PermissionCapability.HOMEWORK_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.QUESTION_BANK_MANAGE)) {
    effectiveSet.add(PermissionCapability.QUESTION_BANK_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.TESTS_MANAGE)) {
    effectiveSet.add(PermissionCapability.TESTS_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.RESULTS_MANAGE)) {
    effectiveSet.add(PermissionCapability.RESULTS_VIEW);
  }
  if (
    effectiveSet.has(PermissionCapability.FEES_MANAGE) ||
    effectiveSet.has(PermissionCapability.PAYMENTS_RECORD)
  ) {
    effectiveSet.add(PermissionCapability.FEES_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.SCHEDULE_MANAGE)) {
    effectiveSet.add(PermissionCapability.SCHEDULE_VIEW);
  }
  if (effectiveSet.has(PermissionCapability.ANNOUNCEMENTS_MANAGE)) {
    effectiveSet.add(PermissionCapability.ANNOUNCEMENTS_VIEW);
  }

  // Convert Set to Array.
  return Array.from(effectiveSet);
}
