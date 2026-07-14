"use server";

import { requireAdmin } from "@/lib/auth/permissions";
import { ActorContext } from "@/lib/domain/actor";
import { ActionResult, handleActionError } from "@/lib/actions/types";
import { updateSiteSettings } from "@/server/services/site-settings";
import { SiteSettingsUpdateSchema } from "@/lib/validation/site-settings";
import { revalidatePath } from "next/cache";

async function getActor(): Promise<ActorContext> {
  const appUser = await requireAdmin();
  return {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };
}

export async function updateSiteSettingsAction(data: unknown): Promise<ActionResult> {
  try {
    const actor = await getActor();
    const parsed = SiteSettingsUpdateSchema.parse(data);
    await updateSiteSettings(actor, parsed);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    revalidatePath("/about");
    revalidatePath("/admissions");
    revalidatePath("/contact");
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
