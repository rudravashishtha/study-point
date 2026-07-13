import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { OrganizationJsonLd } from "@/components/public/OrganizationJsonLd";
import { getSiteSettings } from "@/server/services/site-settings";

export default async function PublicShell({ children }: { children: React.ReactNode }) {
  const settingsResult = await getSiteSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased flex flex-col">
      <PublicHeader settings={settings} />

      <main className="flex-1 w-full">{children}</main>

      <PublicFooter settings={settings} />

      <OrganizationJsonLd settings={settings} />
    </div>
  );
}
