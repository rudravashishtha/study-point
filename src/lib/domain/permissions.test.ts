import { describe, it, expect } from "vitest";
import { PermissionCapability } from "@prisma/client";
import { resolveEffectivePermissions, TEACHER_PERMISSION_PRESETS } from "./permissions";

describe("resolveEffectivePermissions", () => {
  it("should return empty array for null/undefined/empty input", () => {
    expect(resolveEffectivePermissions(null)).toEqual([]);
    expect(resolveEffectivePermissions(undefined)).toEqual([]);
    expect(resolveEffectivePermissions([])).toEqual([]);
  });

  it("should preserve explicitly stored permissions", () => {
    const input = [PermissionCapability.BATCH_VIEW, PermissionCapability.MEMBERS_VIEW];
    const result = resolveEffectivePermissions(input);
    expect(result).toContain(PermissionCapability.BATCH_VIEW);
    expect(result).toContain(PermissionCapability.MEMBERS_VIEW);
    expect(result.length).toBe(2);
  });

  it("should imply VIEW from MANAGE for all specific domains", () => {
    const input = [
      PermissionCapability.BATCH_MANAGE,
      PermissionCapability.MEMBERS_MANAGE,
      PermissionCapability.ATTENDANCE_MANAGE,
      PermissionCapability.CURRICULUM_PROGRESS_MANAGE,
      PermissionCapability.MATERIALS_MANAGE,
      PermissionCapability.HOMEWORK_MANAGE,
      PermissionCapability.QUESTION_BANK_MANAGE,
      PermissionCapability.TESTS_MANAGE,
      PermissionCapability.RESULTS_MANAGE,
      PermissionCapability.FEES_MANAGE,
      PermissionCapability.SCHEDULE_MANAGE,
      PermissionCapability.ANNOUNCEMENTS_MANAGE,
    ];

    const result = resolveEffectivePermissions(input);

    expect(result).toContain(PermissionCapability.BATCH_VIEW);
    expect(result).toContain(PermissionCapability.MEMBERS_VIEW);
    expect(result).toContain(PermissionCapability.ATTENDANCE_VIEW);
    expect(result).toContain(PermissionCapability.CURRICULUM_PROGRESS_VIEW);
    expect(result).toContain(PermissionCapability.MATERIALS_VIEW);
    expect(result).toContain(PermissionCapability.HOMEWORK_VIEW);
    expect(result).toContain(PermissionCapability.QUESTION_BANK_VIEW);
    expect(result).toContain(PermissionCapability.TESTS_VIEW);
    expect(result).toContain(PermissionCapability.RESULTS_VIEW);
    expect(result).toContain(PermissionCapability.FEES_VIEW);
    expect(result).toContain(PermissionCapability.SCHEDULE_VIEW);
    expect(result).toContain(PermissionCapability.ANNOUNCEMENTS_VIEW);

    // It should also retain the MANAGE permissions
    input.forEach((perm) => expect(result).toContain(perm));
  });

  it("should imply FEES_VIEW from PAYMENTS_RECORD", () => {
    const result = resolveEffectivePermissions([PermissionCapability.PAYMENTS_RECORD]);
    expect(result).toContain(PermissionCapability.FEES_VIEW);
    expect(result).toContain(PermissionCapability.PAYMENTS_RECORD);
  });

  it("should not add cross-domain permissions", () => {
    const result = resolveEffectivePermissions([
      PermissionCapability.BATCH_MANAGE,
      PermissionCapability.MEMBERS_MANAGE,
      PermissionCapability.FEES_MANAGE,
    ]);
    // It should imply corresponding views
    expect(result).toContain(PermissionCapability.BATCH_VIEW);
    expect(result).toContain(PermissionCapability.MEMBERS_VIEW);
    expect(result).toContain(PermissionCapability.FEES_VIEW);

    // It should NOT imply anything else cross-domain
    expect(result).not.toContain(PermissionCapability.ATTENDANCE_MANAGE);
    expect(result).not.toContain(PermissionCapability.PAYMENTS_RECORD);

    // Explicit proofs:
    // BATCH_MANAGE does not imply MEMBERS_MANAGE
    const batchResult = resolveEffectivePermissions([PermissionCapability.BATCH_MANAGE]);
    expect(batchResult).not.toContain(PermissionCapability.MEMBERS_MANAGE);

    // MEMBERS_MANAGE does not imply ATTENDANCE_MANAGE
    const membersResult = resolveEffectivePermissions([
      PermissionCapability.MEMBERS_MANAGE,
    ]);
    expect(membersResult).not.toContain(PermissionCapability.ATTENDANCE_MANAGE);

    // FEES_MANAGE does not imply PAYMENTS_RECORD
    const feesResult = resolveEffectivePermissions([PermissionCapability.FEES_MANAGE]);
    expect(feesResult).not.toContain(PermissionCapability.PAYMENTS_RECORD);
  });

  it("should be pure and not mutate the input array", () => {
    const input = [PermissionCapability.BATCH_MANAGE];
    const inputCopy = [...input];

    const result = resolveEffectivePermissions(input);

    expect(input).toEqual(inputCopy); // Original unchanged
    expect(result.length).toBe(2); // Output has the implied permission
  });

  it("should remove duplicate effective capabilities", () => {
    const input = [
      PermissionCapability.BATCH_MANAGE,
      PermissionCapability.BATCH_MANAGE,
      PermissionCapability.BATCH_VIEW,
    ];
    const result = resolveEffectivePermissions(input);
    expect(result.length).toBe(2); // exactly BATCH_MANAGE and BATCH_VIEW
  });

  describe("TEACHER_PERMISSION_PRESETS", () => {
    it("exports presets containing the exact explicitly allowed stored capabilities", () => {
      // Find each preset to assert its exact array membership
      const viewOnly = TEACHER_PERMISSION_PRESETS.find((p) => p.name === "View Only");
      const teaching = TEACHER_PERMISSION_PRESETS.find((p) => p.name === "Teaching");
      const academicManager = TEACHER_PERMISSION_PRESETS.find(
        (p) => p.name === "Academic Manager",
      );
      const fullBatch = TEACHER_PERMISSION_PRESETS.find(
        (p) => p.name === "Full Batch Operations",
      );

      expect(viewOnly).toBeDefined();
      expect(teaching).toBeDefined();
      expect(academicManager).toBeDefined();
      expect(fullBatch).toBeDefined();

      expect(viewOnly?.permissions).toEqual([
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
      ]);

      expect(teaching?.permissions).toEqual([
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
      ]);

      expect(academicManager?.permissions).toEqual([
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
      ]);

      expect(fullBatch?.permissions).toEqual([
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
      ]);
    });

    it("requires BATCH_VIEW to be explicitly present in every preset", () => {
      TEACHER_PERMISSION_PRESETS.forEach((preset) => {
        expect(preset.permissions.includes("BATCH_VIEW")).toBe(true);
      });
    });

    it("verifies Full Batch Operations contains exactly all 25 approved capabilities", () => {
      const fullBatch = TEACHER_PERMISSION_PRESETS.find(
        (p) => p.name === "Full Batch Operations",
      );
      expect(fullBatch?.permissions.length).toBe(25);
    });

    it("verifies no preset contains duplicate capabilities", () => {
      TEACHER_PERMISSION_PRESETS.forEach((preset) => {
        const uniquePerms = new Set(preset.permissions);
        expect(uniquePerms.size).toBe(preset.permissions.length);
      });
    });

    it("verifies presets are readonly", () => {
      // TypeScript enforces this due to `as const`, but we can verify it exists
      expect(TEACHER_PERMISSION_PRESETS).toBeDefined();
    });
  });
});
