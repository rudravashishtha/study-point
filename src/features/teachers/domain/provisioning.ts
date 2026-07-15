export type AppUserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type TeacherInvitationEligibility = {
  canInvite: boolean;
  canReset: boolean;
  reason: "ELIGIBLE" | "INACTIVE_TEACHER" | "MISSING_EMAIL" | "ALREADY_PROVISIONED";
};

export function getTeacherInvitationEligibility({
  active,
  email,
  appUserStatus,
}: {
  active: boolean;
  email: string | null | undefined;
  appUserStatus: AppUserStatus | null | undefined;
}): TeacherInvitationEligibility {
  if (!active) {
    return { canInvite: false, canReset: false, reason: "INACTIVE_TEACHER" };
  }
  if (!email) {
    return { canInvite: false, canReset: false, reason: "MISSING_EMAIL" };
  }
  if (appUserStatus === "ACTIVE") {
    return { canInvite: false, canReset: false, reason: "ALREADY_PROVISIONED" };
  }
  if (appUserStatus === "INVITED") {
    return { canInvite: false, canReset: true, reason: "ALREADY_PROVISIONED" };
  }
  if (appUserStatus === "DISABLED") {
    return { canInvite: false, canReset: false, reason: "ALREADY_PROVISIONED" };
  }

  return { canInvite: true, canReset: false, reason: "ELIGIBLE" };
}

export type ProvisioningDisplayStatus = "Uninvited" | "Invited" | "Active" | "Disabled";

export function getProvisioningDisplayStatus(
  appUserStatus: AppUserStatus | null | undefined,
): ProvisioningDisplayStatus {
  if (!appUserStatus) {
    return "Uninvited";
  }

  switch (appUserStatus) {
    case "INVITED":
      return "Invited";
    case "ACTIVE":
      return "Active";
    case "DISABLED":
      return "Disabled";
  }
}
