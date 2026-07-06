import { Megaphone } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminAnnouncementsPage() {
  return (
    <EmptyState
      icon={Megaphone}
      title="Announcement shell"
      description="Public, curriculum, and batch-targeted announcements are planned for a later phase."
    />
  );
}
