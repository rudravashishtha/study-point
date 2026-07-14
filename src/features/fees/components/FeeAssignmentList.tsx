"use client";

import React, { useState, useMemo } from "react";
import { Prisma, FeeAssignmentStatus } from "@prisma/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { FeeAssignmentRowActions } from "./FeeAssignmentRowActions";
import dynamic from "next/dynamic";

const FeeAssignmentPreviewDialog = dynamic(
  () => import("./FeeAssignmentPreviewDialog").then((m) => m.FeeAssignmentPreviewDialog),
  { loading: () => null },
);

type AssignmentWithRelations = Prisma.StudentFeeAssignmentGetPayload<{
  include: {
    enrolment: { include: { student: true } };
    feePlan: true;
    _count: { select: { dues: true } };
  };
}>;

type FeePlanWithRelations = Prisma.FeePlanGetPayload<{
  include: {
    instalments: { orderBy: { displayOrder: "asc" } };
    academicSession: true;
    curriculumTrack: true;
    batch: true;
  };
}>;

type EnrolmentWithRelations = Prisma.EnrolmentGetPayload<{
  include: {
    student: true;
    batch: true;
    academicSession: true;
    curriculumTrack: true;
  };
}>;

export function FeeAssignmentList({
  assignments,
  feePlans,
  enrolments,
  defaultArchiveFilter = "active",
}: {
  assignments: AssignmentWithRelations[];
  feePlans: FeePlanWithRelations[];
  sessions: { id: string; name: string }[];
  tracks: { id: string; displayName: string }[];
  batches: { id: string; name: string; archivedAt: Date | null }[];
  enrolments: EnrolmentWithRelations[];
  defaultArchiveFilter?: "active" | "archived" | "all";
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [feePlanFilter, setFeePlanFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<FeeAssignmentStatus | "">("");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">(
    defaultArchiveFilter,
  );

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const isArchived = !!a.archivedAt;
      if (archiveFilter === "active" && isArchived) return false;
      if (archiveFilter === "archived" && !isArchived) return false;
      if (feePlanFilter && a.feePlanId !== feePlanFilter) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = a.enrolment?.student?.fullName ?? "";
        const code = a.enrolment?.student?.studentCode ?? "";
        const plan = a.feePlan?.name ?? "";
        if (
          !name.toLowerCase().includes(q) &&
          !code.toLowerCase().includes(q) &&
          !plan.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [assignments, searchQuery, feePlanFilter, statusFilter, archiveFilter]);

  const counts = useMemo(() => {
    const total = assignments.length;
    const active = assignments.filter((a) => !a.archivedAt).length;
    const archived = total - active;
    return { total, active, archived };
  }, [assignments]);

  const formatAmount = (amount: number | string | null | undefined) => {
    if (!amount) return "\u20B90.00";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    return `\u20B9${num.toFixed(2)}`;
  };

  const formatDate = (d: Date | string | null) => {
    if (!d) return "-";
    return format(new Date(d), "dd MMM yy");
  };

  const statusBadge = (status: FeeAssignmentStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Counts */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted-foreground">
          Total: <strong>{counts.total}</strong>
        </span>
        <span className="text-green-700">
          Active: <strong>{counts.active}</strong>
        </span>
        <span className="text-muted-foreground">
          Archived: <strong>{counts.archived}</strong>
        </span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <input
            type="text"
            placeholder="Search student or fee plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-64"
          />

          <select
            value={feePlanFilter}
            onChange={(e) => setFeePlanFilter(e.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Fee Plans</option>
            {feePlans.map((fp) => (
              <option key={fp.id} value={fp.id}>
                {fp.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeeAssignmentStatus | "")}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
          </select>

          <select
            value={archiveFilter}
            onChange={(e) =>
              setArchiveFilter(e.target.value as "active" | "archived" | "all")
            }
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>

        <button
          onClick={() => {
            setShowPreview(true);
          }}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Assign Fee Plan
        </button>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <DataListEmpty
          title="No fee assignments found."
          isFiltered={
            searchQuery !== "" ||
            feePlanFilter !== "" ||
            statusFilter !== "" ||
            archiveFilter !== "active"
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Student</TableHead>
                  <TableHead className="whitespace-nowrap">Fee Plan</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Status</TableHead>
                  <TableHead className="text-center whitespace-nowrap">Dues</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">
                        {a.enrolment?.student?.fullName ?? "Unknown"}
                      </div>
                      {a.enrolment?.student?.studentCode && (
                        <div className="text-xs text-muted-foreground">
                          {a.enrolment.student.studentCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>{a.feePlan?.name ?? "-"}</div>
                      <div className="text-xs text-muted-foreground">
                        Start: {formatDate(a.startsOn)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(a.assignedTotalAmount.toString())}
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(a.status)}</TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {a._count.dues}
                    </TableCell>
                    <TableCell className="text-right">
                      <FeeAssignmentRowActions assignment={a} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="flex flex-col space-y-4 md:hidden">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {a.enrolment?.student?.fullName ?? "Unknown"}
                  </span>
                  {statusBadge(a.status)}
                </div>

                <div className="text-sm space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan</span>
                    <span className="font-medium">{a.feePlan?.name ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span>{formatAmount(a.assignedTotalAmount.toString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Code</span>
                    <span>{a.enrolment?.student?.studentCode ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dues</span>
                    <span>{a._count.dues}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starts</span>
                    <span>{formatDate(a.startsOn)}</span>
                  </div>
                  {a.archivedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-muted-foreground">Archived</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <FeeAssignmentRowActions assignment={a} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FeeAssignmentPreviewDialog
        open={showPreview}
        onOpenChange={setShowPreview}
        feePlans={feePlans}
        enrolments={enrolments}
      />
    </div>
  );
}
