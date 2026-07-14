import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listAcademicSessions } from "@/server/services/academic-sessions";
import { SessionList } from "@/features/academic-sessions/components/SessionList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
} from "@/components/layout/page-header";
import { DataListToolbar, DataListFilters } from "@/components/layout/data-list-toolbar";

export default async function AcademicSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const allowedSortFields = ["createdAt", "name", "startsOn", "endsOn"] as const;

  // Note: searchParams is a promise in Next.js 15, but since we're using Next.js 16.x App Router
  // we might need to await it. Let's assume standard synchronous usage if not using next@canary yet,
  // Wait, Next 15+ strictly requires awaiting searchParams. Let's do it safely just in case.
  const resolvedParams = await searchParams;

  await requireAdmin();

  const params = parseListParams(resolvedParams, allowedSortFields, "name");

  const { data: sessions, total } = await listAcademicSessions({
    page: params.page,
    pageSize: params.pageSize,
    archiveState: params.archiveState,
    query: params.query,
    sortField: params.sortField,
    sortDir: params.sortDir,
  });

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Academic Sessions</PageHeaderHeading>
          <PageHeaderDescription>Manage academic years and terms.</PageHeaderDescription>
        </div>
        <PageHeaderActions />
      </PageHeader>

      <DataListToolbar>
        <DataListSearch placeholder="Search sessions..." />
        <DataListFilters>
          <DataListArchiveFilter />
        </DataListFilters>
      </DataListToolbar>

      {sessions.length === 0 ? (
        <DataListEmpty
          title="No academic sessions found."
          isFiltered={params.query !== "" || params.archiveState !== "active"}
        />
      ) : (
        <>
          <SessionList sessions={sessions} />
          <DataListPagination
            currentPage={params.page}
            totalItems={total}
            pageSize={params.pageSize}
          />
        </>
      )}
    </div>
  );
}
