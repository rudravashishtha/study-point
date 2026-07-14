import { requireAdmin } from "@/lib/auth/permissions";
import { Settings } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return (
    <EmptyState
      icon={Settings}
      title="Settings shell"
      description="Environment-backed configuration and institute settings will be added as the foundation matures."
    />
  );
}
