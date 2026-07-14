import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listTracks } from "@/server/services/curriculum/tracks";
import { listBoards } from "@/server/services/curriculum/boards";
import { listProgrammes } from "@/server/services/curriculum/programmes";
import { listSubjects } from "@/server/services/curriculum/subjects";
import { TrackList } from "@/features/curriculum/components/tracks/TrackList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { LayoutTemplate } from "lucide-react";
import Link from "next/link";

export default async function AdminCurriculumTracksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const allowedSortFields = ["createdAt", "updatedAt", "displayName"] as const;

  const resolvedParams = await searchParams;
  await requireAdmin();

  const params = parseListParams(resolvedParams, allowedSortFields, "displayName");

  const [
    { data: tracks, total },
    { data: boards },
    { data: programmes },
    { data: subjects },
  ] = await Promise.all([
    listTracks({
      page: params.page,
      pageSize: params.pageSize,
      archiveState: params.archiveState,
      query: params.query,
      sortField: params.sortField,
      sortDir: params.sortDir,
    }),
    listBoards({
      page: 1,
      pageSize: 1000,
      archiveState: "active",
      query: "",
      sortField: "name",
      sortDir: "asc",
    }),
    listProgrammes({
      page: 1,
      pageSize: 1000,
      archiveState: "active",
      query: "",
      sortField: "name",
      sortDir: "asc",
    }),
    listSubjects({
      page: 1,
      pageSize: 1000,
      archiveState: "active",
      query: "",
      sortField: "name",
      sortDir: "asc",
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b">
        <LayoutTemplate className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Curriculum Tracks</h1>
          <p className="text-muted-foreground">
            Manage curriculum tracks, chapters, and topics.
          </p>
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
        <DataListSearch placeholder="Search tracks..." />
        <DataListArchiveFilter />
      </div>

      {tracks.length === 0 && !params.query && params.archiveState === "active" ? (
        <DataListEmpty title="No tracks found." isFiltered={false} />
      ) : tracks.length === 0 ? (
        <DataListEmpty title="No tracks found." isFiltered={true} />
      ) : (
        <>
          <TrackList
            tracks={tracks}
            boards={boards}
            programmes={programmes}
            subjects={subjects}
          />
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
