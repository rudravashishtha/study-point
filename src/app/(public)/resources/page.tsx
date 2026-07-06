import { FileText } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function ResourcesPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Resources</h1>
      <div className="mt-6">
        <EmptyState
          icon={FileText}
          title="Public resources shell"
          description="Free resources will be published here without email capture."
        />
      </div>
    </section>
  );
}
