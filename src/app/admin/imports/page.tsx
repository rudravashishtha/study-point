import { requireAdmin } from "@/lib/auth/permissions";
import { listImportJobs } from "@/server/services/imports";
import { ImportHistoryPageClient } from "./client-page";

export const dynamic = "force-dynamic";

export default async function AdminImportsPage() {
  await requireAdmin();

  const result = await listImportJobs({ page: 1, pageSize: 50 }, "");

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Data Imports</h1>
          <p className="text-muted-foreground mt-1">
            Import students, questions, and other data.
          </p>
        </div>
      </div>

      <ImportHistoryPageClient initialJobs={result.data.items} total={result.data.total} />
    </div>
  );
}
