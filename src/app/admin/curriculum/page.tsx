import { BookMarked, GraduationCap, Library, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/permissions";

export default async function AdminCurriculumPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b">
        <BookMarked className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curriculum</h1>
          <p className="text-muted-foreground">
            Manage boards, programmes, subjects, and curriculum tracks.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/curriculum/boards"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          <div className="h-full rounded-xl border bg-card text-card-foreground shadow hover:bg-muted/50 transition-colors p-6">
            <div className="flex items-center gap-2 mb-2">
              <LayoutTemplate className="h-5 w-5 text-primary" />
              <h3 className="font-semibold leading-none tracking-tight">Boards</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Educational boards (e.g. CBSE, ICSE, State Boards).
            </p>
          </div>
        </Link>

        <Link
          href="/admin/curriculum/programmes"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          <div className="h-full rounded-xl border bg-card text-card-foreground shadow hover:bg-muted/50 transition-colors p-6">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold leading-none tracking-tight">Programmes</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Academic programmes linked to boards (e.g. Class X, JEE).
            </p>
          </div>
        </Link>

        <Link
          href="/admin/curriculum/subjects"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          <div className="h-full rounded-xl border bg-card text-card-foreground shadow hover:bg-muted/50 transition-colors p-6">
            <div className="flex items-center gap-2 mb-2">
              <Library className="h-5 w-5 text-primary" />
              <h3 className="font-semibold leading-none tracking-tight">Subjects</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Independent subjects mapped across various tracks.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
