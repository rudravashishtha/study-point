import Link from "next/link";
import { MapPin, Phone, Mail, MessageSquare, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicFooterProps {
  settings: {
    instituteName: string;
    tagline?: string | null;
    phone?: string | null;
    whatsappNumber?: string | null;
    email?: string | null;
    address?: string | null;
    landmark?: string | null;
    mapUrl?: string | null;
    openingHours?: string | null;
    socialLinks?: Record<string, string> | null;
  } | null;
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Globe,
  instagram: Globe,
  youtube: Globe,
  twitter: Globe,
};

const defaultQuickLinks = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/announcements", label: "Notices" },
  { href: "/contact", label: "Contact" },
  { href: "/admissions", label: "Admissions" },
];

export function PublicFooter({ settings }: PublicFooterProps) {
  const instituteName = settings?.instituteName ?? "Study Point";
  const tagline = settings?.tagline ?? null;
  const phone = settings?.phone ?? null;
  const whatsappNumber = settings?.whatsappNumber ?? null;
  const email = settings?.email ?? null;
  const address = settings?.address ?? null;
  const landmark = settings?.landmark ?? null;
  const mapUrl = settings?.mapUrl ?? null;
  const openingHours = settings?.openingHours ?? null;
  const socialLinks = settings?.socialLinks ?? null;

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, "")}`
    : "#";

  const phoneHref = phone ? `tel:${phone.replace(/\D/g, "")}` : "#";
  const emailHref = email ? `mailto:${email}` : "#";

  return (
    <footer
      className="border-t border-border/60 bg-surface-elevated/50"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 font-heading font-bold text-xl text-foreground">
              <span className="text-brand-glow">△</span>
              <span>{instituteName}</span>
            </div>
            {tagline && (
              <p className="text-sm text-muted-foreground max-w-xs">{tagline}</p>
            )}
            <p className="text-sm text-muted-foreground max-w-xs">
              Excellence in Mathematics Education for Classes IX–XII
            </p>

            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <div className="flex gap-3 pt-2">
                {Object.entries(socialLinks).map(([platform, url]) => {
                  const Icon = socialIcons[platform.toLowerCase()];
                  return Icon ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      aria-label={`Follow us on ${platform}`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </a>
                  ) : null;
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <address className="not-italic text-sm text-muted-foreground space-y-2">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <svg
                    className="size-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                      aria-hidden="true"
                    />
                  </svg>
                  <span>{phone}</span>
                </a>
              )}
              {whatsappNumber && (
                <a
                  href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <svg
                    className="size-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path
                      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                      aria-hidden="true"
                    />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  <svg
                    className="size-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>{email}</span>
                </a>
              )}
              {(address || landmark) && (
                <div className="flex items-start gap-2">
                  <svg
                    className="size-4 shrink-0 mt-0.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div className="text-sm text-muted-foreground">
                    {address && <p>{address}</p>}
                    {landmark && <p>Near {landmark}</p>}
                  </div>
                </div>
              )}
              {mapUrl && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <svg
                    className="size-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>View on Map</span>
                </a>
              )}
              {openingHours && (
                <p className="text-sm text-muted-foreground">
                  <strong>Hours:</strong> {openingHours}
                </p>
              )}
            </address>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <nav aria-label="Quick links">
              <ul className="space-y-2">
                {defaultQuickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-8 border-t border-border/60 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {instituteName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
