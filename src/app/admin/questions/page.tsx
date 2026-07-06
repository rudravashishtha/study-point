import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminQuestionsPage() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Question bank shell"
      description="Question creation, filtering, LaTeX rendering, and import support are Phase 5 and Phase 6 work."
    />
  );
}
