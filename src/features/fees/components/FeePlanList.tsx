"use client";

import React, { useState, useMemo } from "react";
import { Prisma, FeePlanFrequency } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { FeePlanRowActions } from "./FeePlanRowActions";
import dynamic from "next/dynamic";

const FeePlanFormDialog = dynamic(
  () => import("./FeePlanFormDialog").then((m) => m.FeePlanFormDialog),
  { loading: () => null },
);

type FeePlanWithRelations = Prisma.FeePlanGetPayload<{
  include: {
    instalments: true;
    academicSession: true;
    curriculumTrack: { include: { board: true; subject: true } };
    batch: true;
  };
}>;

export function FeePlanList({
  feePlans,
  sessions,
  tracks,
  batches,
}: {
  feePlans: FeePlanWithRelations[];
  sessions: { id: string; name: string }[];
  tracks: { id: string; displayName: string }[];
  batches: {
    id: string;
    name: string;
    archivedAt: Date | null;
    academicSessionId: string;
    curriculumTrackId: string;
  }[];
}) {
  const [editingPlan, setEditingPlan] = useState<FeePlanWithRelations | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">(
    "active",
  );
  const [frequencyFilter, setFrequencyFilter] = useState<FeePlanFrequency | "">("");

  const filteredPlans = useMemo(() => {
    return feePlans.filter((plan) => {
      if (archiveFilter === "active" && plan.archivedAt) return false;
      if (archiveFilter === "archived" && !plan.archivedAt) return false;
      if (frequencyFilter && plan.frequency !== frequencyFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!plan.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [feePlans, searchQuery, archiveFilter, frequencyFilter]);

  const handleEdit = (plan: FeePlanWithRelations) => {
    setEditingPlan(plan);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPlan(undefined);
    setIsFormOpen(true);
  };

  const formatAmount = (amount: number | string | null | undefined) => {
    if (!amount) return "₹0.00";
    const num = typeof amount === "number" ? amount : parseFloat(amount);
    return `₹${num.toFixed(2)}`;
  };

  const frequencyLabel = (freq: FeePlanFrequency) => {
    const labels: Record<FeePlanFrequency, string> = {
      MONTHLY: "Monthly",
      QUARTERLY: "Quarterly",
      YEARLY: "Yearly",
      CUSTOM: "Custom",
    };
    return labels[freq];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="flex flex-1 flex-col space-y-2 md:flex-row md:space-x-2 md:space-y-0">
          <input
            type="text"
            placeholder="Search fee plans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:w-64"
          />

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

          <select
            value={frequencyFilter}
            onChange={(e) => setFrequencyFilter(e.target.value as FeePlanFrequency | "")}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">All Frequencies</option>
            <option value="MONTHLY">Monthly</option>
            <option value="QUARTERLY">Quarterly</option>
            <option value="YEARLY">Yearly</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Fee Plan
        </button>
      </div>

      {filteredPlans.length === 0 ? (
        <DataListEmpty
          title="No fee plans found."
          isFiltered={
            searchQuery !== "" || archiveFilter !== "active" || frequencyFilter !== ""
          }
        />
      ) : (
        <>
          {/* Desktop View */}
          <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-center">Public</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{plan.name}</span>
                        {plan.archivedAt && (
                          <Badge variant="secondary">Archived</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatAmount(plan.totalAmount.toString())}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        {frequencyLabel(plan.frequency)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.curriculumTrack?.displayName || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.batch?.name || "All batches"}
                    </TableCell>
                    <TableCell className="text-center">
                      {plan.showPublicly ? (
                        <span className="text-green-600 font-medium">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <FeePlanRowActions plan={plan} onEdit={() => handleEdit(plan)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="flex flex-col space-y-4 md:hidden">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{plan.name}</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    {frequencyLabel(plan.frequency)}
                  </Badge>
                </div>

                <div className="text-sm space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatAmount(plan.totalAmount.toString())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Track</span>
                    <span>{plan.curriculumTrack?.displayName || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch</span>
                    <span>{plan.batch?.name || "All"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Public</span>
                    <span>{plan.showPublicly ? "Yes" : "No"}</span>
                  </div>
                  {plan.archivedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-muted-foreground">Archived</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t">
                  <FeePlanRowActions plan={plan} onEdit={() => handleEdit(plan)} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <FeePlanFormDialog
        plan={editingPlan}
        sessions={sessions}
        tracks={tracks}
        batches={batches}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
