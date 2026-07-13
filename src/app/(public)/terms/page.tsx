import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/server/services/site-settings";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Use | Study Point Mathematics",
  description:
    "The terms that govern your use of the Study Point Mathematics website and services.",
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
};

export default async function TermsPage() {
  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point Mathematics";

  return (
    <main className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().getFullYear()}
        </p>

        <div className="mt-8 space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Acceptance of terms
            </h2>
            <p className="mt-2 leading-relaxed">
              By accessing or using the {instituteName} website, you agree to these terms.
              If you do not agree, please do not use the site.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Use of the website
            </h2>
            <p className="mt-2 leading-relaxed">
              This website is provided for information about our mathematics coaching for
              Classes IX to XII. You agree to use it lawfully and not to misuse its
              content or attempt to disrupt its operation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Enquiries and admissions
            </h2>
            <p className="mt-2 leading-relaxed">
              Sending an enquiry does not guarantee admission. Admission is confirmed only
              through our official process. Fee and batch details published here are
              indicative and may change.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Intellectual property
            </h2>
            <p className="mt-2 leading-relaxed">
              Study materials, notes, and other content shared with enrolled students
              remain the property of {instituteName} and may not be redistributed without
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold font-heading text-foreground">
              Contact
            </h2>
            <p className="mt-2 leading-relaxed">
              Questions about these terms can be sent via our{" "}
              <Link
                href="/contact"
                className="font-medium text-primary underline underline-offset-4"
              >
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
