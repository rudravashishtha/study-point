import { Settings } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminSettingsPage() {
  return (
    <EmptyState
      icon={Settings}
      title="Settings shell"
      description="Environment-backed configuration and institute settings will be added as the foundation matures."
    />
  );
}
