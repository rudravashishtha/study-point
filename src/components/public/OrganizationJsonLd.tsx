import { siteConfig } from "@/config/site";
import { siteUrl } from "@/lib/seo";

interface OrganizationJsonLdProps {
  settings?: {
    instituteName?: string | null;
    phone?: string | null;
    email?: string | null;
    socialLinks?: Record<string, string> | null;
  } | null;
}

function buildOrganizationJsonLd(settings?: OrganizationJsonLdProps["settings"]) {
  const name = settings?.instituteName ?? siteConfig.name;
  const email = settings?.email ?? siteConfig.contact.email;
  const phone = settings?.phone ?? siteConfig.contact.phone;

  const sameAs =
    settings?.socialLinks && Object.values(settings.socialLinks).length > 0
      ? Object.values(settings.socialLinks)
      : [];

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: siteUrl,
    description: siteConfig.description,
    contactPoint: {
      "@type": "ContactPoint",
      telephone: phone,
      email,
      contactType: "Admissions",
    },
    sameAs,
  };
}

export function OrganizationJsonLd({ settings }: OrganizationJsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildOrganizationJsonLd(settings)),
      }}
    />
  );
}
