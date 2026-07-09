import React from "react";
import { requireAdmin } from "@/lib/auth/permissions";
import { parseListParams } from "@/lib/url/search-params";
import { listStudents } from "@/server/services/students";
import { StudentList } from "@/features/students/components/StudentList";
import { DataListSearch } from "@/components/admin/data-list/DataListSearch";
import { DataListArchiveFilter } from "@/components/admin/data-list/DataListArchiveFilter";
import { StudentAccountStatusFilter } from "@/features/students/components/StudentAccountStatusFilter";
import { DataListPagination } from "@/components/admin/data-list/DataListPagination";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { CreateStudentButton } from "./CreateStudentButton";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
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
    sort: params.sortField as any,
    direction: params.sortDir,
  });

  if (!listResult.success) {
    throw new Error(listResult.error.message);
  }

  const { data: students, total } = listResult.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <CreateStudentButton />
      </div>

      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <DataListSearch placeholder="Search by name or code..." />
        <div className="flex items-center space-x-2">
          <StudentAccountStatusFilter />
          <DataListArchiveFilter />
        </div>
      </div>

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
