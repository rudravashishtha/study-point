import { Users } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminStudentsPage() {
  return (
    <EmptyState
      icon={Users}
      title="Student management shell"
      description="Student search, filters, enrolments, and account activation are planned for later phases."
    />
  );
}
