import { FileSpreadsheet } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminImportsPage() {
  return (
    <EmptyState
      icon={FileSpreadsheet}
      title="Import shell"
      description="Student and question imports will validate curriculum scope before confirmation."
    />
  );
}
