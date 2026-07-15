import { describe, it, expect } from "vitest";
import {
  getTeacherInvitationEligibility,
  getProvisioningDisplayStatus,
} from "./provisioning";

describe("Teacher Provisioning Domain", () => {
  describe("getTeacherInvitationEligibility", () => {
    it("returns ELIGIBLE for active teacher with email and no AppUser", () => {
      expect(
        getTeacherInvitationEligibility({
          active: true,
          email: "t@example.com",
          appUserStatus: null,
        }),
      ).toEqual({ canInvite: true, canReset: false, reason: "ELIGIBLE" });
    });

    it("returns INACTIVE_TEACHER for inactive teacher", () => {
      expect(
        getTeacherInvitationEligibility({
          active: false,
          email: "t@example.com",
          appUserStatus: null,
        }),
      ).toEqual({ canInvite: false, canReset: false, reason: "INACTIVE_TEACHER" });
    });

    it("returns MISSING_EMAIL for teacher without email", () => {
      expect(
        getTeacherInvitationEligibility({
          active: true,
          email: null,
          appUserStatus: null,
        }),
      ).toEqual({ canInvite: false, canReset: false, reason: "MISSING_EMAIL" });
    });

    it("returns canReset=true for INVITED teacher", () => {
      expect(
        getTeacherInvitationEligibility({
          active: true,
          email: "t@example.com",
          appUserStatus: "INVITED",
        }),
      ).toEqual({ canInvite: false, canReset: true, reason: "ALREADY_PROVISIONED" });
    });

    it("returns ALREADY_PROVISIONED for ACTIVE teacher", () => {
      expect(
        getTeacherInvitationEligibility({
          active: true,
          email: "t@example.com",
          appUserStatus: "ACTIVE",
        }),
      ).toEqual({ canInvite: false, canReset: false, reason: "ALREADY_PROVISIONED" });
    });

    it("returns ALREADY_PROVISIONED for DISABLED teacher", () => {
      expect(
        getTeacherInvitationEligibility({
          active: true,
          email: "t@example.com",
          appUserStatus: "DISABLED",
        }),
      ).toEqual({ canInvite: false, canReset: false, reason: "ALREADY_PROVISIONED" });
    });
  });

  describe("getProvisioningDisplayStatus", () => {
    it("returns Uninvited when no AppUser", () => {
      expect(getProvisioningDisplayStatus(null)).toBe("Uninvited");
    });

    it("returns Invited for INVITED status", () => {
      expect(getProvisioningDisplayStatus("INVITED")).toBe("Invited");
    });

    it("returns Active for ACTIVE status", () => {
      expect(getProvisioningDisplayStatus("ACTIVE")).toBe("Active");
    });

    it("returns Disabled for DISABLED status", () => {
      expect(getProvisioningDisplayStatus("DISABLED")).toBe("Disabled");
    });
  });
});
