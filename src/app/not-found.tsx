import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The route is not available in this phase of the application."
      />
      <Link
        href="/"
        className="mx-auto mt-5 rounded-md px-3 py-2 text-sm font-medium text-primary outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      >
        Return home
      </Link>
    </main>
  );
}
