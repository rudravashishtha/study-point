import { MapPin, MessageCircle, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl font-semibold">Contact</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Contact details, map, directions, and WhatsApp settings will be managed through
          structured website content.
        </p>
      </div>
      <div className="grid gap-3">
        {[Phone, MessageCircle, MapPin].map((Icon, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4">
            <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Contact detail placeholder</p>
          </div>
        ))}
      </div>
    </section>
  );
}
