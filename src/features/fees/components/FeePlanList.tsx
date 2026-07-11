"use client";

import React, { useState, useMemo } from "react";
import { Prisma, FeePlanFrequency } from "@prisma/client";
import { DataListTableShell } from "@/components/admin/data-list/DataListTableShell";
import { DataListMobileShell } from "@/components/admin/data-list/DataListMobileShell";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { FeePlanRowActions } from "./FeePlanRowActions";
import { FeePlanFormDialog } from "./FeePlanFormDialog";

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

  const formatAmount = (amount: any) => {
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
          <DataListTableShell
            headers={
              <>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Name
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Frequency
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Track
                </th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                  Batch
                </th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">
                  Public
                </th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </>
            }
          >
            {filteredPlans.map((plan) => (
              <tr key={plan.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-4 font-medium">
                  <div className="flex items-center space-x-2">
                    <span>{plan.name}</span>
                    {plan.archivedAt && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Archived
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-sm">{formatAmount(plan.totalAmount)}</td>
                <td className="p-4 text-sm">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                    {frequencyLabel(plan.frequency)}
                  </span>
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {plan.curriculumTrack?.displayName || "-"}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {plan.batch?.name || "All batches"}
                </td>
                <td className="p-4 text-center text-sm">
                  {plan.showPublicly ? (
                    <span className="text-green-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <FeePlanRowActions plan={plan} onEdit={() => handleEdit(plan)} />
                </td>
              </tr>
            ))}
          </DataListTableShell>

          <DataListMobileShell>
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{plan.name}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                    {frequencyLabel(plan.frequency)}
                  </span>
                </div>

                <div className="text-sm space-y-1 mb-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{formatAmount(plan.totalAmount)}</span>
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
          </DataListMobileShell>
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
