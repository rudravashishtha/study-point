import { BookMarked } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";

export default function CoursesPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Courses</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        Public course content will be grouped by CBSE and CISCE, with ICSE and ISC
        represented under CISCE.
      </p>
      <div className="mt-6">
        <EmptyState
          icon={BookMarked}
          title="Course content shell"
          description="Structured course publishing arrives after curriculum and content models are implemented."
        />
      </div>
    </section>
  );
}
