import { Metadata } from "next";
import {
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle2,
  GraduationCap,
  Users,
  Target,
  Mail,
} from "lucide-react";
import { getSiteSettings } from "@/server/services/site-settings";
import { WhatsAppButton } from "@/features/public/components/WhatsAppButton";
import { AdmissionsForm } from "@/features/public/components/AdmissionsForm";
import { LocationMap } from "@/features/public/components/LocationMap";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Admissions | Study Point Mathematics",
  description:
    "Admissions open for Classes IX–XII (CBSE & CISCE). Enquire about mathematics coaching at Study Point. Simple admission process, free demo class, and personal counselling.",
};

const highlights = [
  {
    icon: Target,
    title: "Concept-First Teaching",
    description: "Every topic is built from fundamentals to real exam confidence.",
  },
  {
    icon: Users,
    title: "Small Batches",
    description: "Personal attention and regular doubt resolution in focused groups.",
  },
  {
    icon: CheckCircle2,
    title: "Regular Assessment",
    description: "Chapter and full-syllabus tests with clear, actionable feedback.",
  },
  {
    icon: GraduationCap,
    title: "Board Expertise",
    description: "Aligned with CBSE and CISCE patterns for Classes IX–XII.",
  },
];

const processSteps = [
  { title: "Enquire", description: "Share your details through the form or WhatsApp." },
  {
    title: "Counselling",
    description: "A short call to understand goals and current level.",
  },
  { title: "Demo Class", description: "Attend a free demo class with the teacher." },
  { title: "Enrol", description: "Choose a batch and complete a simple enrolment." },
  { title: "Begin", description: "Start regular classes and track steady progress." },
];

const classCards = [
  { level: "Class IX", note: "Build strong foundations." },
  { level: "Class X", note: "Board-focused preparation." },
  { level: "Class XI", note: "Advanced concepts and practice." },
  { level: "Class XII", note: "Exam readiness and revision." },
];

export default async function AdmissionsPage() {
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

  const whatsappMessage = `Hello ${instituteName}, I want to enquire about admissions for mathematics coaching.`;

  return (
    <div className="space-y-0">
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-glow/10 to-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Admissions Open
            </p>
            <h1 className="text-4xl font-bold font-heading tracking-tight text-foreground md:text-5xl lg:text-6xl">
              Join Study Point for Classes IX–XII
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Personalised mathematics coaching built on clear concepts, regular practice,
              and consistent assessment. Enquire in minutes — we&apos;ll guide you from
              there.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <WhatsAppButton
                phoneNumber={whatsappNumber}
                message={whatsappMessage}
                ariaLabel="Enquire on WhatsApp"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <MessageSquare className="size-5" aria-hidden="true" />
                Enquire on WhatsApp
              </WhatsAppButton>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-4 text-lg font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <Phone className="size-5" aria-hidden="true" />
                  Call {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20" aria-labelledby="why-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Why Choose Us
            </p>
            <h2
              id="why-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
            >
              A coaching experience that puts understanding first
            </h2>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-6 transition-colors hover:bg-accent"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-20" aria-labelledby="process-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Admission Process
            </p>
            <h2
              id="process-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
            >
              Five simple steps to get started
            </h2>
          </header>
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step, index) => (
              <li
                key={step.title}
                className="relative rounded-2xl border border-border bg-card p-6"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-12 md:py-20" aria-labelledby="classes-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Classes Offered
            </p>
            <h2
              id="classes-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
            >
              Mathematics for Classes IX–XII
            </h2>
            <p className="mt-3 text-muted-foreground">
              Coaching aligned with CBSE and CISCE boards.
            </p>
          </header>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {classCards.map((card) => (
              <div
                key={card.level}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <h3 className="text-xl font-bold font-heading text-foreground">
                  {card.level}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-12 md:py-20" aria-labelledby="enquiry-heading">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <header className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-glow">
              Start Your Enquiry
            </p>
            <h2
              id="enquiry-heading"
              className="text-3xl font-bold font-heading tracking-tight text-foreground md:text-4xl"
            >
              Send us your details
            </h2>
            <p className="mt-3 text-muted-foreground">
              Fill the form and we&apos;ll open a WhatsApp chat with your enquiry
              pre-filled. No account needed.
            </p>
          </header>
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <AdmissionsForm
              whatsappNumber={whatsappNumber}
              instituteName={instituteName}
            />
          </div>
        </div>
      </section>

      <section className="py-12 md:py-20" aria-labelledby="contact-heading">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-5">
              <h2
                id="contact-heading"
                className="text-3xl font-bold font-heading tracking-tight text-foreground"
              >
                Reach us directly
              </h2>
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, "")}`}
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
                      Office Hours
                    </span>
                    <span className="text-base font-semibold text-foreground">
                      {openingHours}
                    </span>
                  </span>
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
        </div>
      </section>
    </div>
  );
}
