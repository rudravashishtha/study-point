import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function StudentHomeworkPage() {
  return (
    <EmptyState
      icon={ClipboardCheck}
      title="Homework shell"
      description="Published homework for the active enrolment will appear here in the student portal phase."
    />
  );
}
