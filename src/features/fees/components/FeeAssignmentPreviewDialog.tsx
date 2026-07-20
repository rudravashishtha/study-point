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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      toast.error("Error", { description: "Please select a fee plan and start date" });
      return;
    }
    if (selectedEnrolmentIds.size === 0) {
      toast.error("Error", { description: "Please select at least one enrolment" });
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
        toast.error("Error", { description: res.error });
        setLoading(false);
        return;
      }
      setPreviewResult(res.data!);
    } catch {
      toast.error("Error", { description: "Preview failed" });
    }
    setLoading(false);
  };

  const handleReset = () => {
    setPreviewResult(null);
    setShowConfirm(false);
  };

  const formatAmount = (amount: number | string | { toNumber: () => number }) => {
    let num: number;
    if (typeof amount === "number") {
      num = amount;
    } else if (typeof amount === "string") {
      num = parseFloat(amount);
    } else {
      num = amount.toNumber();
    }
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
        <DialogContent className="sm:max-w-[95vw] p-0 flex flex-col overflow-hidden h-[90vh] max-h-[90vh]">
          <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
            <DialogTitle>Assign Fee Plan to Students</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 flex flex-col gap-6">
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Configuration
                </h3>

                <div className="space-y-3">
                  <label className="block mb-1.5 text-sm font-medium">Fee Plan *</label>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <label className="block mb-1.5 text-sm font-medium">Start Date *</label>
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
                      <div className="space-y-3">
                        <label className="block mb-1.5 text-sm font-medium">End Date</label>
                        <input
                          type="date"
                          value={endsOn}
                          onChange={(e) => setEndsOn(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>

                    <div className="rounded-md bg-muted p-3 text-sm space-y-1">
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
                  </>
                )}
              </section>

              {selectedFeePlan && (
                <section className="space-y-4 flex-1 flex flex-col min-h-[300px]">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Target Enrolments
                    </h3>
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

                  <div className="flex-1 overflow-y-auto rounded-md border divide-y min-h-[200px]">
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
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {e.student?.fullName ?? "Unknown"}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                {e.student?.studentCode ?? ""}{" "}
                                {e.batch && `• ${e.batch.name}`}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="w-full md:w-2/3 flex flex-col">
              <section className="space-y-4 h-full flex flex-col">
                <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                  Preview
                </h3>

                {!previewResult ? (
                  <div className="flex-1 flex flex-col items-center justify-center border rounded-md border-dashed text-center p-8 text-muted-foreground">
                    <p className="mb-2">
                      Select a fee plan and enrolments to generate a preview.
                    </p>
                    {selectedFeePlan && (
                      <Button
                        type="button"
                        onClick={handlePreview}
                        disabled={loading || !startsOn || selectedEnrolmentIds.size === 0}
                      >
                        {loading ? "Generating Preview..." : "Generate Preview"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col space-y-4">
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

                    <div className="flex-1 overflow-y-auto rounded-md border w-full min-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">Student</TableHead>
                            <TableHead className="whitespace-nowrap">Status</TableHead>
                            <TableHead className="whitespace-nowrap">Dues</TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              Total
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewResult.items.map((item) => (
                            <TableRow key={item.enrolmentId}>
                              <TableCell>
                                <div className="font-medium">
                                  {item.studentName ?? "Unknown"}
                                </div>
                                {item.studentCode && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.studentCode}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
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
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
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
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatAmount(item.totalAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (previewResult) {
                  handleReset();
                } else {
                  onOpenChange(false);
                }
              }}
            >
              {previewResult ? "Reset" : "Cancel"}
            </Button>

            {previewResult && (
              <Button
                type="button"
                onClick={() => setShowConfirm(true)}
                disabled={previewResult.totals.valid === 0}
              >
                Confirm Assignment
              </Button>
            )}
          </div>
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
