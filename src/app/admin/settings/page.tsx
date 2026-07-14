import { requireAdmin } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { SettingsPageClient } from "./SettingsPageClient";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await db.siteSettings.findFirst();

  if (!settings) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Settings not found. Seed your database.
      </div>
    );
  }

  return <SettingsPageClient settings={settings} />;
}
