import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listStudents, type ListStudentsInput } from "@/server/services/students";
import { StudentList } from "@/features/students/components/StudentList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { StudentAccountStatusFilter } from "@/features/students/components/StudentAccountStatusFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { CreateStudentButton } from "./CreateStudentButton";
import {
  PageHeader,
  PageHeaderHeading,
  PageHeaderDescription,
  PageHeaderActions,
} from "@/components/layout/page-header";
import { DataListToolbar, DataListFilters } from "@/components/layout/data-list-toolbar";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const allowedSortFields = [
    "fullName",
    "studentCode",
    "joiningDate",
    "createdAt",
    "updatedAt",
  ] as const;

  const resolvedParams = await searchParams;

  await requireAdmin();

  const params = parseListParams(resolvedParams, allowedSortFields, "fullName");

  const accountStatusParam = Array.isArray(resolvedParams.accountStatus)
    ? resolvedParams.accountStatus[0]
    : resolvedParams.accountStatus;

  const accountStatus = (
    ["none", "invited", "active", "disabled"].includes(accountStatusParam as string)
      ? accountStatusParam
      : undefined
  ) as "none" | "invited" | "active" | "disabled" | undefined;

  const listResult = await listStudents({
    page: params.page,
    pageSize: params.pageSize,
    archiveState:
      params.archiveState === "active"
        ? "ACTIVE_ONLY"
        : params.archiveState === "archived"
          ? "ARCHIVED_ONLY"
          : "ALL",
    q: params.query,
    accountStatus: accountStatus,
    sort: params.sortField as ListStudentsInput["sort"],
    direction: params.sortDir,
  });

  if (!listResult.success) {
    throw new Error(listResult.error.message);
  }

  const { items: students, totalCount: total } = listResult.data;

  return (
    <div className="space-y-6">
      <PageHeader>
        <div>
          <PageHeaderHeading>Students</PageHeaderHeading>
          <PageHeaderDescription>
            Manage student enrolment and access.
          </PageHeaderDescription>
        </div>
        <PageHeaderActions>
          <CreateStudentButton />
        </PageHeaderActions>
      </PageHeader>

      <DataListToolbar>
        <DataListSearch placeholder="Search by name or code..." />
        <DataListFilters>
          <StudentAccountStatusFilter />
          <DataListArchiveFilter />
        </DataListFilters>
      </DataListToolbar>

      {students.length === 0 ? (
        <DataListEmpty
          title="No students found."
          isFiltered={params.query !== "" || params.archiveState !== "active"}
        />
      ) : (
        <>
          <StudentList students={students} />
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
