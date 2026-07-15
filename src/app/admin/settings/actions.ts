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
        const result = await updateSiteSettings(actor, parsed);
        if (!result.success) {
          throw new Error(
            typeof result.error === "string" ? result.error : result.error.message,
          );
        }
        return { success: true, data: undefined };
      },
    ),
  ),
);
