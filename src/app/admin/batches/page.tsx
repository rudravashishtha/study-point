import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listBatches, type ListBatchesInput } from "@/server/services/batches";
import { listAcademicSessions } from "@/server/services/academic-sessions";
import { listTracks } from "@/server/services/curriculum/tracks";
import { BatchList } from "@/features/batches/components/BatchList";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { CreateBatchButton } from "./CreateBatchButton";
import { CurriculumTrack, Board, Subject, Programme } from "@prisma/client";

import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
} from "@/components/layout/page-header";
import { DataListToolbar, DataListFilters } from "@/components/layout/data-list-toolbar";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";

type TrackWithRelations = CurriculumTrack & {
  board: Board;
  subject: Subject;
  programme: Programme | null;
};

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
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
      sort: params.sortField as ListBatchesInput["sort"],
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
      <PageHeader>
        <div>
          <PageHeaderHeading>Batches</PageHeaderHeading>
          <PageHeaderDescription>Manage class batches and schedules.</PageHeaderDescription>
        </div>
        <PageHeaderActions>
          <CreateBatchButton sessions={sessions} tracks={tracks as TrackWithRelations[]} />
        </PageHeaderActions>
      </PageHeader>

      <DataListToolbar>
        <DataListSearch placeholder="Search batches..." />
        <DataListFilters>
          <DataListArchiveFilter />
        </DataListFilters>
      </DataListToolbar>

      {listResult.items.length === 0 ? (
        <DataListEmpty
          title="No batches found."
          isFiltered={params.query !== "" || params.archiveState !== "active"}
        />
      ) : (
        <>
          <BatchList
            batches={
              listResult.items as (import("@prisma/client").Batch & {
                academicSession: import("@prisma/client").AcademicSession;
                curriculumTrack: TrackWithRelations;
                _count: { enrolments: number };
              })[]
            }
            sessions={sessions}
            tracks={tracks as TrackWithRelations[]}
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
