import { WalletCards } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function AdminFeesPage() {
  return (
    <EmptyState
      icon={WalletCards}
      title="Fee management shell"
      description="Fee plans, reviewed due generation, payments, and allocations are planned for Phase 7."
    />
  );
}
