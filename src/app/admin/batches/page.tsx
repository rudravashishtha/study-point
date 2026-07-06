import { CalendarDays } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminBatchesPage() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Batch management shell"
      description="Curriculum-scoped batches and timetable management arrive after the data foundation."
    />
  );
}
