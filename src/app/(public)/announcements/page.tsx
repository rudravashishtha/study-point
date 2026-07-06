import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AnnouncementsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Announcements</h1>
      <div className="mt-6">
        <EmptyState
          icon={Megaphone}
          title="Announcement shell"
          description="Public notices will appear here once announcement management is implemented."
        />
      </div>
    </section>
  );
}
