import { WalletCards } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function StudentFeesPage() {
  return (
    <EmptyState
      icon={WalletCards}
      title="Fee status shell"
      description="Confirmed dues, payments, allocations, and receipts will be read-only for students."
    />
  );
}
