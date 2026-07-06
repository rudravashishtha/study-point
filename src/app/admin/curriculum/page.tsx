import { BookMarked } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminCurriculumPage() {
  return (
    <EmptyState
      icon={BookMarked}
      title="Curriculum shell"
      description="Board, programme, subject, curriculum track, chapter, and topic management begins in Phase 2."
    />
  );
}
