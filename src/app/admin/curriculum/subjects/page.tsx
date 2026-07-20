import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listSubjects } from "@/server/services/curriculum/subjects";
import { SubjectList } from "@/features/curriculum/components/subjects/SubjectList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { Library } from "lucide-react";
import Link from "next/link";

export default async function AdminCurriculumSubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const allowedSortFields = ["createdAt", "updatedAt", "name", "code"] as const;

  const resolvedParams = await searchParams;
  await requireAdmin();

  const params = parseListParams(resolvedParams, allowedSortFields, "code");

  const { data: subjects, total } = await listSubjects({
    page: params.page,
    pageSize: params.pageSize,
    archiveState: params.archiveState,
    query: params.query,
    sortField: params.sortField,
    sortDir: params.sortDir,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b">
        <Library className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage independent subjects.</p>
        </div>
        <div className="ml-auto">
          <Link
            href="/admin/curriculum"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            &larr; Back to Curriculum
          </Link>
        </div>
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <DataListSearch placeholder="Search subjects..." />
        <DataListArchiveFilter />
      </div>

      <SubjectList subjects={subjects} emptyState={
        <DataListEmpty
          title="No subjects found."
          isFiltered={params.query !== "" || params.archiveState !== "active"}
        />
      } />

      {subjects.length > 0 && (
        <DataListPagination
          currentPage={params.page}
          totalItems={total}
          pageSize={params.pageSize}
        />
      )}
    </div>
  );
}
