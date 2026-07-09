import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listBatches } from "@/server/services/batches";
import { listAcademicSessions } from "@/server/services/academic-sessions";
import { listTracks } from "@/server/services/curriculum/tracks";
import { BatchList } from "@/features/batches/components/BatchList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { CreateBatchButton } from "./CreateBatchButton";

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const allowedSortFields = ["name", "capacity", "createdAt", "updatedAt"] as const;

  const resolvedParams = await searchParams;

  await requireAdmin();

  const params = parseListParams(resolvedParams, allowedSortFields, "createdAt");

  const [listResult, sessionsResult, tracksResult] = await Promise.all([
    listBatches({
      page: params.page,
      pageSize: params.pageSize,
      archiveState:
        params.archiveState === "active"
          ? "ACTIVE_ONLY"
          : params.archiveState === "archived"
            ? "ARCHIVED_ONLY"
            : "ALL",
      q: params.query,
      sort: params.sortField as any,
      direction: params.sortDir,
    }),
    listAcademicSessions({
      page: 1,
      pageSize: 100,
      archiveState: "all",
      query: "",
      sortField: "createdAt",
      sortDir: "desc",
    }),
    listTracks({
      page: 1,
      pageSize: 100,
      archiveState: "all",
      query: "",
      sortField: "createdAt",
      sortDir: "desc",
    }),
  ]);

  const sessions = sessionsResult.data;
  const tracks = tracksResult.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
        <CreateBatchButton sessions={sessions} tracks={tracks as any} />
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <DataListSearch placeholder="Search batches..." />
        <div className="flex items-center space-x-2">
          {/* We can add Session and Track filters here later */}
          <DataListArchiveFilter />
        </div>
      </div>

      {listResult.items.length === 0 ? (
        <DataListEmpty
          title="No batches found."
          isFiltered={params.query !== "" || params.archiveState !== "active"}
        />
      ) : (
        <>
          <BatchList
            batches={listResult.items as any}
            sessions={sessions}
            tracks={tracks as any}
          />
          <DataListPagination
            currentPage={params.page}
            totalItems={listResult.total}
            pageSize={params.pageSize}
          />
        </>
      )}
    </div>
  );
}
