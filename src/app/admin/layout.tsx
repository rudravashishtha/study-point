import { AdminShell } from "@/components/layout/admin-shell";
import { getSiteSettings } from "@/server/services/site-settings";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point";

  return <AdminShell instituteName={instituteName}>{children}</AdminShell>;
}
