import { CalendarClock } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function StudentTimetablePage() {
  return (
    <EmptyState
      icon={CalendarClock}
      title="Timetable shell"
      description="Authorized batch schedule and live links will be visible only after server-side checks are in place."
    />
  );
}
