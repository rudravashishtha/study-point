"use server";

import { updateSiteSettings } from "@/server/services/site-settings";
import { SiteSettingsUpdateSchema } from "@/lib/validation/site-settings";
import { withActor, withAuthorization, withRevalidation } from "@/lib/actions/wrappers";

export const updateSiteSettingsAction = withActor(
  withAuthorization(
    "ADMIN",
    withRevalidation(
      ["/admin/settings", "/", "/about", "/admissions", "/contact"],
      async (actor, data: unknown) => {
        const parsed = SiteSettingsUpdateSchema.parse(data);
        await updateSiteSettings(actor, parsed);
        return { success: true, data: undefined };
      }
    )
  )
);
