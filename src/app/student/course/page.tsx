import { BookOpen } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function StudentCoursePage() {
  return (
    <EmptyState
      icon={BookOpen}
      title="Course shell"
      description="Current course, curriculum track, batch, and schedule will appear here after Phase 2 and Phase 4."
    />
  );
}
