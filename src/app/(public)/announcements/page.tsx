export const revalidate = 120;

import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { listPublicAnnouncements } from "@/server/services/announcements";
import { PublicAnnouncementList } from "@/features/announcements/components/PublicAnnouncementList";
import { EmptyState } from "@/components/feedback/empty-state";

export const metadata: Metadata = {
  title: "Announcements | Study Point",
  description:
    "Latest announcements, notices, and updates from Study Point for students and parents.",
  alternates: { canonical: "/announcements" },
  openGraph: { url: "/announcements" },
};

export default async function AnnouncementsPage() {
  const result = await listPublicAnnouncements();

  if (!result.success) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Announcements</h1>
        <div className="mt-6">
          <EmptyState
            icon={Megaphone}
            title="Error loading announcements"
            description={result.error.message}
          />
        </div>
      </section>
    );
  }

  const announcements = result.data.items;

  if (announcements.length === 0) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold">Announcements</h1>
        <div className="mt-6">
          <EmptyState
            icon={Megaphone}
            title="No announcements"
            description="There are currently no public announcements. Check back later."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Announcements</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Important notices and updates.
      </p>
      <div className="mt-6">
        <PublicAnnouncementList announcements={announcements} />
      </div>
    </section>
  );
}
