import { requireAdmin } from "@/lib/auth/permissions";
import { listImportJobs } from "@/server/services/imports";
import { ImportHistoryPageClient } from "./client-page";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
} from "@/components/layout/page-header";

export default async function AdminImportsPage() {
  await requireAdmin();

  const result = await listImportJobs({ page: 1, pageSize: 50 }, "");

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Data Imports</PageHeaderHeading>
          <PageHeaderDescription>Import students, questions, and other data.</PageHeaderDescription>
        </div>
      </PageHeader>

      <ImportHistoryPageClient
        initialJobs={result.data.items}
        total={result.data.total}
      />
    </div>
  );
}
