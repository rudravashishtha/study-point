import { requireAdmin } from "@/lib/auth/permissions";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default async function AdminQuestionsPage() {
  await requireAdmin();
  return (
    <EmptyState
      icon={ClipboardList}
      title="Question Bank"
      description="Coming in a future update — question creation, filtering, LaTeX rendering, and bulk import are being developed."
    />
  );
}
