import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/server/services/site-settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy | Study Point Mathematics",
  description:
    "How Study Point Mathematics collects, uses, and protects your information.",
};

export default async function PrivacyPage() {
  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point Mathematics";

  return (
    <main className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Information we collect
            </h2>
            <p className="mt-2 leading-relaxed">
              {instituteName} collects only the information you choose to share with us —
              for example, your name, phone number, class, and message when you send an
              admission enquiry through WhatsApp or contact us directly. We do not require
              you to create an account to browse this website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              How we use your information
            </h2>
            <p className="mt-2 leading-relaxed">
              Information you share is used solely to respond to your enquiry, assist with
              admissions, and provide course-related information. We do not sell or rent
              your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Data sharing
            </h2>
            <p className="mt-2 leading-relaxed">
              We share your information only with the teachers and staff needed to serve
              you, and only as required by law. Enquiry messages sent via WhatsApp are
              handled by WhatsApp&rsquo;s own privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Your choices
            </h2>
            <p className="mt-2 leading-relaxed">
              You may request access to, correction of, or deletion of the information you
              have shared with us by contacting us through the details on our{" "}
              <Link
                href="/contact"
                className="font-medium text-primary underline underline-offset-4"
              >
                contact page
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Changes to this policy
            </h2>
            <p className="mt-2 leading-relaxed">
              We may update this policy from time to time. Material changes will be
              reflected by the &ldquo;Last updated&rdquo; date above.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
