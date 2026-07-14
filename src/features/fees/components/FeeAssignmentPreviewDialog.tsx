"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import { previewFeeAssignmentAction } from "@/app/admin/fee-assignments/actions";
import { FeeAssignmentConfirmDialog } from "./FeeAssignmentConfirmDialog";
import type {
  FeeAssignmentTargetInput,
  PreviewFeeAssignmentResult,
} from "@/server/services/fee-assignments";
import type { Prisma } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

export function FeeAssignmentPreviewDialog({
  open,
  onOpenChange,
  feePlans,
  enrolments,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feePlans: FeePlanWithRelations[];
  enrolments: EnrolmentWithRelations[];
}) {
  const [selectedFeePlanId, setSelectedFeePlanId] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [selectedEnrolmentIds, setSelectedEnrolmentIds] = useState<Set<string>>(
    new Set(),
  );
  const [previewResult, setPreviewResult] = useState<PreviewFeeAssignmentResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedFeePlan = feePlans.find((fp) => fp.id === selectedFeePlanId);

  const matchingEnrolments = useMemo(() => {
    if (!selectedFeePlan) return [];
    return enrolments.filter(
      (e) =>
        e.academicSessionId === selectedFeePlan.academicSessionId &&
        e.curriculumTrackId === selectedFeePlan.curriculumTrackId &&
        (!selectedFeePlan.batchId || e.batchId === selectedFeePlan.batchId) &&
        !e.archivedAt &&
        e.status === "active",
    );
  }, [selectedFeePlan, enrolments]);

  const handleSelectAll = () => {
    if (selectedEnrolmentIds.size === matchingEnrolments.length) {
      setSelectedEnrolmentIds(new Set());
    } else {
      setSelectedEnrolmentIds(new Set(matchingEnrolments.map((e) => e.id)));
    }
  };

  const toggleEnrolment = (id: string) => {
    const next = new Set(selectedEnrolmentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedEnrolmentIds(next);
  };

  const handlePreview = async () => {
    if (!selectedFeePlanId || !startsOn) {
      toast.error("Please select a fee plan and start date");
      return;
    }
    if (selectedEnrolmentIds.size === 0) {
      toast.error("Please select at least one enrolment");
      return;
    }
    setLoading(true);
    setPreviewResult(null);
    try {
      const input: FeeAssignmentTargetInput = {
        feePlanId: selectedFeePlanId,
        enrolmentIds: Array.from(selectedEnrolmentIds),
        startsOn,
        endsOn: endsOn || null,
      };
      const res = await previewFeeAssignmentAction(input);
      if (!res.success) {
        toast.error(res.error);
        setLoading(false);
        return;
      }
      setPreviewResult(res.data!);
    } catch {
      toast.error("Preview failed");
    }
    setLoading(false);
  };

  const handleReset = () => {
    setPreviewResult(null);
    setShowConfirm(false);
  };

  const formatAmount = (amount: number | { toNumber: () => number }) => {
    const num = typeof amount === "number" ? amount : amount.toNumber();
    return `\u20B9${num.toFixed(2)}`;
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Fee Plan to Students</DialogTitle>
          </DialogHeader>

          {/* Fee Plan Selector */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Fee Plan *</label>
            <select
              value={selectedFeePlanId}
              onChange={(e) => {
                setSelectedFeePlanId(e.target.value);
                setPreviewResult(null);
                setSelectedEnrolmentIds(new Set());
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a fee plan</option>
              {feePlans
                .filter((fp) => !fp.archivedAt && fp.isActive)
                .map((fp) => (
                  <option key={fp.id} value={fp.id}>
                    {fp.name} ({fp.curriculumTrack?.displayName ?? "N/A"})
                  </option>
                ))}
            </select>
          </div>

          {selectedFeePlan && (
            <>
              {/* Date Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date *</label>
                  <input
                    type="date"
                    value={startsOn}
                    onChange={(e) => {
                      setStartsOn(e.target.value);
                      setPreviewResult(null);
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <input
                    type="date"
                    value={endsOn}
                    onChange={(e) => setEndsOn(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Fee Plan Summary */}
              <div className="rounded-md bg-muted p-3 mb-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">{selectedFeePlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">
                    {formatAmount(selectedFeePlan.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Track</span>
                  <span>{selectedFeePlan.curriculumTrack?.displayName ?? "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch</span>
                  <span>{selectedFeePlan.batch?.name ?? "All batches"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequency</span>
                  <span>{selectedFeePlan.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Instalments</span>
                  <span>{selectedFeePlan.instalments.length}</span>
                </div>
              </div>

              {/* Enrolment Selection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">
                    Target Enrolments ({matchingEnrolments.length} available)
                  </label>
                  {matchingEnrolments.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {selectedEnrolmentIds.size === matchingEnrolments.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  )}
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border divide-y">
                  {matchingEnrolments.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No matching enrolments found for this fee plan.
                    </p>
                  ) : (
                    matchingEnrolments.map((e) => {
                      const isSelected = selectedEnrolmentIds.has(e.id);
                      return (
                        <label
                          key={e.id}
                          className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors ${
                            isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEnrolment(e.id)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <span className="font-medium flex-1">
                            {e.student?.fullName ?? "Unknown"}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {e.student?.studentCode ?? ""}
                          </span>
                          {e.batch && (
                            <span className="text-muted-foreground text-xs hidden md:inline">
                              {e.batch.name}
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Preview Button */}
              <div className="flex justify-end mb-4">
                <Button
                  type="button"
                  onClick={handlePreview}
                  disabled={loading || !startsOn || selectedEnrolmentIds.size === 0}
                >
                  {loading ? "Generating Preview..." : "Generate Preview"}
                </Button>
              </div>
            </>
          )}

          {/* Preview Results */}
          {previewResult && (
            <div className="border-t pt-4 space-y-4">
              {/* Totals */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-md bg-blue-50 p-3 text-center">
                  <div className="text-lg font-bold text-blue-800">
                    {previewResult.totals.valid}
                  </div>
                  <div className="text-xs text-blue-600">Valid</div>
                </div>
                <div className="rounded-md bg-red-50 p-3 text-center">
                  <div className="text-lg font-bold text-red-800">
                    {previewResult.totals.invalid}
                  </div>
                  <div className="text-xs text-red-600">Invalid</div>
                </div>
                <div className="rounded-md bg-yellow-50 p-3 text-center">
                  <div className="text-lg font-bold text-yellow-800">
                    {previewResult.totals.duplicates}
                  </div>
                  <div className="text-xs text-yellow-600">Duplicates</div>
                </div>
                <div className="rounded-md bg-green-50 p-3 text-center">
                  <div className="text-lg font-bold text-green-800">
                    {formatAmount(previewResult.totals.totalAmount)}
                  </div>
                  <div className="text-xs text-green-600">Total Amount</div>
                </div>
              </div>

              {/* Warnings */}
              {previewResult.warnings.length > 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p className="font-medium mb-1">Warnings</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {previewResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Per-Enrolment Dues */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">
                        Student
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">
                        Dues
                      </th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {previewResult.items.map((item) => (
                      <tr
                        key={item.enrolmentId}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4">
                          <div className="font-medium">
                            {item.studentName ?? "Unknown"}
                          </div>
                          {item.studentCode && (
                            <div className="text-xs text-muted-foreground">
                              {item.studentCode}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          {item.hasExistingActiveAssignment ? (
                            <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              Skipped
                            </span>
                          ) : item.valid ? (
                            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                              Valid
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-muted-foreground">
                          {item.proposedDues.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {item.proposedDues.map((d, i) => (
                                <li key={i}>
                                  {d.label} — {formatAmount(d.amountDue)} (
                                  {formatDate(d.dueDate)})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right font-medium">
                          {formatAmount(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Button */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={previewResult.totals.valid === 0}
                >
                  Confirm Assignment
                </Button>
              </div>
            </div>
          )}

          {/* Cancel / Close */}
          {!previewResult && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <FeeAssignmentConfirmDialog
        open={showConfirm}
        onOpenChange={(v) => {
          setShowConfirm(v);
          if (!v) {
            onOpenChange(false);
            setPreviewResult(null);
            setSelectedEnrolmentIds(new Set());
            setSelectedFeePlanId("");
            setStartsOn("");
            setEndsOn("");
          }
        }}
        input={{
          feePlanId: selectedFeePlanId,
          enrolmentIds: Array.from(selectedEnrolmentIds),
          startsOn,
          endsOn: endsOn || null,
        }}
        validCount={previewResult?.totals.valid ?? 0}
      />
    </>
  );
}
