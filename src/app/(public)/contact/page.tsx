import { Metadata } from "next";
import { Phone, Mail, MapPin, Clock, MessageSquare, Share2 } from "lucide-react";
import { getSiteSettings } from "@/server/services/site-settings";
import { WhatsAppButton } from "@/features/public/components/WhatsAppButton";
import { LocationMap } from "@/features/public/components/LocationMap";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact | Study Point Mathematics",
  description:
    "Get in touch with Study Point Mathematics. Call, WhatsApp, or visit us. Find our address, map, directions, and opening hours.",
};

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Share2,
  instagram: Share2,
  youtube: Share2,
  twitter: Share2,
};

function formatTel(value: string): string {
  return `tel:${value.replace(/\D/g, "")}`;
}

export default async function ContactPage() {
  const result = await getSiteSettings();
  const settings = result.success ? result.data : null;

  const instituteName = settings?.instituteName ?? "Study Point";
  const phone = settings?.phone ?? null;
  const whatsappNumber = settings?.whatsappNumber ?? null;
  const email = settings?.email ?? null;
  const address = settings?.address ?? null;
  const landmark = settings?.landmark ?? null;
  const mapUrl = settings?.mapUrl ?? null;
  const openingHours = settings?.openingHours ?? null;
  const socialLinks = settings?.socialLinks ?? null;

  const whatsappMessage = `Hello ${instituteName}, I would like to enquire about mathematics coaching admissions.`;

  const hasContactDetails = Boolean(
    phone || whatsappNumber || email || address || landmark || openingHours,
  );

  return (
    <div className="space-y-0">
      <section className="bg-muted/30 py-12 md:py-20" aria-labelledby="contact-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Get in Touch
            </p>
            <h1
              id="contact-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl lg:text-5xl"
            >
              Contact Us
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have questions about admissions, batches, or classes? Reach out and
              we&apos;ll be happy to help.
            </p>
          </header>

          {!hasContactDetails ? (
            <p className="mx-auto max-w-md text-center text-muted-foreground">
              Contact details are not configured yet. Please check back soon.
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-5">
                {phone && (
                  <a
                    href={formatTel(phone)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Phone className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {phone}
                      </span>
                    </span>
                  </a>
                )}

                {whatsappNumber && (
                  <WhatsAppButton
                    phoneNumber={whatsappNumber}
                    message={whatsappMessage}
                    ariaLabel="Message us on WhatsApp"
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MessageSquare className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        WhatsApp
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        Message us
                      </span>
                    </span>
                  </WhatsAppButton>
                )}

                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Mail className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Email
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {email}
                      </span>
                    </span>
                  </a>
                )}

                {(address || landmark) && (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <MapPin className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Address
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {address}
                        {landmark ? (
                          <span className="font-normal"> (Near {landmark})</span>
                        ) : null}
                      </span>
                    </span>
                  </div>
                )}

                {openingHours && (
                  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="size-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Opening Hours
                      </span>
                      <span className="text-base font-semibold text-foreground">
                        {openingHours}
                      </span>
                    </span>
                  </div>
                )}

                {socialLinks && Object.keys(socialLinks).length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Follow us
                    </span>
                    {Object.entries(socialLinks).map(([platform, url]) => {
                      const Icon = socialIcons[platform.toLowerCase()] ?? Share2;
                      return (
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
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <LocationMap
                  instituteName={instituteName}
                  address={address}
                  mapUrl={mapUrl}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
