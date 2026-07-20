import { StudentIntakeSubmissionStatus } from "@prisma/client";

import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/permissions";
import { listAcademicSessions } from "@/server/services/academic-sessions";
import { listBatches } from "@/server/services/batches";
import { listTracks } from "@/server/services/curriculum/tracks";
import { listIntakeSubmissions } from "@/server/services/student-intake";
import { IntakeSubmissionQueue } from "@/features/student-intake/components/IntakeSubmissionQueue";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminIntakeSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Number(first(params.page) || "1");
  const q = first(params.q)?.trim() || "";
  const rawStatus = first(params.status);
  const status = Object.values(StudentIntakeSubmissionStatus).includes(
    rawStatus as StudentIntakeSubmissionStatus,
  )
    ? (rawStatus as StudentIntakeSubmissionStatus)
    : undefined;
  const academicSessionId = first(params.academicSessionId) || undefined;
  const curriculumTrackId = first(params.curriculumTrackId) || undefined;
  const batchId = first(params.batchId) || undefined;

  const [submissions, sessionsResult, tracksResult, batchesResult] = await Promise.all([
    listIntakeSubmissions({
      q,
      status,
      academicSessionId,
      curriculumTrackId,
      batchId,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: 20,
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
          <PageHeaderHeading>Intake submissions</PageHeaderHeading>
          <PageHeaderDescription>
            Review private intake submissions before creating student records.
          </PageHeaderDescription>
        </div>
      </PageHeader>

      <form className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search..."
          className="h-10 rounded-md border bg-background px-3 text-sm lg:col-span-2"
        />
        <select name="status" defaultValue={status ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Any status</option>
          {Object.values(StudentIntakeSubmissionStatus).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select name="academicSessionId" defaultValue={academicSessionId ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Any session</option>
          {sessionsResult.data.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name}
            </option>
          ))}
        </select>
        <select name="curriculumTrackId" defaultValue={curriculumTrackId ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Any class</option>
          {tracksResult.data.map((track) => (
            <option key={track.id} value={track.id}>
              {track.displayName || `Class ${track.classLevel}`}
            </option>
          ))}
        </select>
        <select name="batchId" defaultValue={batchId ?? ""} className="h-10 rounded-md border bg-background px-3 text-sm">
          <option value="">Any batch</option>
          {batchesResult.items.map((batch) => (
            <option key={batch.id} value={batch.id}>
              {batch.name}
            </option>
          ))}
        </select>
        <Button type="submit" className="sm:col-span-2 lg:col-span-1">
          Filter
        </Button>
      </form>

      {submissions.items.length === 0 ? (
        <DataListEmpty title="No intake submissions found." isFiltered={q !== "" || !!status} />
      ) : (
        <>
          <IntakeSubmissionQueue submissions={submissions.items} />
          <DataListPagination
            currentPage={submissions.page}
            totalItems={submissions.totalCount}
            pageSize={submissions.pageSize}
          />
        </>
      )}
    </div>
  );
}
