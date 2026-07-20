import { requireAdmin } from "@/lib/auth/permissions";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListFilters, DataListToolbar } from "@/components/layout/data-list-toolbar";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/layout/page-header";
import { parseListParams } from "@/lib/url/search-params";
import { listAcademicSessions } from "@/server/services/academic-sessions";
import { listBatches } from "@/server/services/batches";
import { listTracks } from "@/server/services/curriculum/tracks";
import { listIntakeLinks } from "@/server/services/student-intake";
import { IntakeLinkManagement } from "@/features/student-intake/components/IntakeLinkManagement";

export default async function AdminIntakeLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const resolvedParams = await searchParams;
  const params = parseListParams(resolvedParams, ["createdAt"] as const, "createdAt");

  const [links, sessionsResult, tracksResult, batchesResult] = await Promise.all([
    listIntakeLinks({
      q: params.query,
      archiveState:
        params.archiveState === "active"
          ? "ACTIVE_ONLY"
          : params.archiveState === "archived"
            ? "ARCHIVED_ONLY"
            : "ALL",
      page: params.page,
      pageSize: params.pageSize,
    }),
    listAcademicSessions({
      page: 1,
      pageSize: 100,
      archiveState: "active",
      query: "",
      sortField: "createdAt",
      sortDir: "desc",
    }),
    listTracks({
      page: 1,
      pageSize: 100,
      archiveState: "active",
      query: "",
      sortField: "createdAt",
      sortDir: "desc",
    }),
    listBatches({
      page: 1,
      pageSize: 100,
      archiveState: "ACTIVE_ONLY",
      sort: "name",
      direction: "asc",
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Intake links</PageHeaderHeading>
          <PageHeaderDescription>
            Create private mobile links for student information submissions.
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <DataListToolbar>
        <DataListSearch placeholder="Search links..." />
        <DataListFilters>
          <DataListArchiveFilter />
        </DataListFilters>
      </DataListToolbar>

      <IntakeLinkManagement
        links={links.items}
        sessions={sessionsResult.data}
        tracks={tracksResult.data}
        batches={batchesResult.items}
      />
      {links.items.length === 0 && (
        <DataListEmpty title="No intake links found." isFiltered={params.query !== ""} />
      )}
      {links.items.length > 0 && (
        <DataListPagination
          currentPage={links.page}
          totalItems={links.totalCount}
          pageSize={links.pageSize}
        />
      )}
    </div>
  );
}
