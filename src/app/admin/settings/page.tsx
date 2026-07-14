import { requireAdmin } from "@/lib/auth/permissions";
import { Settings } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <EmptyState
      icon={Settings}
      title="Settings"
      description="Coming in a future update — administrative settings and configuration will be available here."
    />
  );
}
