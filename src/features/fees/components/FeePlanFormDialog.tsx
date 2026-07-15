"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Prisma, FeePlanFrequency } from "@prisma/client";
import { createFeePlanAction, updateFeePlanAction } from "@/app/admin/fees/actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

type FeePlanWithRelations = Prisma.FeePlanGetPayload<{
  include: {
    instalments: true;
    academicSession: true;
    curriculumTrack: { include: { board: true; subject: true } };
    batch: true;
  };
}>;

interface InstallmentInput {
  id?: string;
  label: string;
  dueOffsetDays: string;
  dueDate: string;
  amount: string;
  displayOrder: number;
}

function defaultInstallment(displayOrder: number): InstallmentInput {
  return {
    label: "",
    dueOffsetDays: "",
    dueDate: "",
    amount: "",
    displayOrder,
  };
}

export function FeePlanFormDialog({
  plan,
  sessions,
  tracks,
  batches,
  open,
  onOpenChange,
}: {
  plan?: FeePlanWithRelations;
  sessions: { id: string; name: string }[];
  tracks: { id: string; displayName: string }[];
  batches: {
    id: string;
    name: string;
    archivedAt: Date | null;
    academicSessionId: string;
    curriculumTrackId: string;
  }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<FeePlanFrequency>(
    plan?.frequency || "MONTHLY",
  );
  const [instalments, setInstalments] = useState<InstallmentInput[]>(
    plan?.instalments?.length
      ? plan.instalments.map((i) => ({
          id: i.id,
          label: i.label,
          dueOffsetDays: i.dueOffsetDays?.toString() || "",
          dueDate: i.dueDate ? new Date(i.dueDate).toISOString().split("T")[0] : "",
          amount: i.amount?.toString() || "",
          displayOrder: i.displayOrder,
        }))
      : [defaultInstallment(0)],
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload = {
      academicSessionId: formData.get("academicSessionId") as string,
      curriculumTrackId: formData.get("curriculumTrackId") as string,
      batchId: (formData.get("batchId") as string) || null,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      totalAmount: parseFloat(formData.get("totalAmount") as string),
      frequency: frequency,
      showPublicly: formData.get("showPublicly") === "on",
      instalments: instalments
        .filter((i) => i.label.trim())
        .map((i) => ({
          ...(i.id ? { id: i.id } : {}),
          label: i.label,
          dueOffsetDays: i.dueOffsetDays ? parseInt(i.dueOffsetDays, 10) : null,
          dueDate: i.dueDate || null,
          amount: parseFloat(i.amount),
          displayOrder: i.displayOrder,
        })),
    };

    startTransition(async () => {
      const res = plan
        ? await updateFeePlanAction(plan.id, payload)
        : await createFeePlanAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          plan ? "Fee plan updated successfully" : "Fee plan created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  const addInstallment = () => {
    setInstalments([...instalments, defaultInstallment(instalments.length)]);
  };

  const removeInstallment = (index: number) => {
    setInstalments(instalments.filter((_, i) => i !== index));
  };

  const updateInstallment = (
    index: number,
    field: keyof InstallmentInput,
    value: string | number,
  ) => {
    const updated = [...instalments];
    updated[index] = { ...updated[index], [field]: value };
    setInstalments(updated);
  };

  const totalFromInstalments = instalments
    .filter((i) => i.amount)
    .reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>{plan ? "Edit Fee Plan" : "Create Fee Plan"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <form id="fee-plan-form" onSubmit={handleSubmit} className="space-y-8">
            {/* General Information */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                General Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Plan Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    defaultValue={plan?.name}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. Class XI Annual Fee"
                  />
                </div>
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    defaultValue={plan?.description || ""}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Optional description..."
                  />
                </div>
              </div>
            </section>

            {/* Scope & Pricing */}
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
                Scope & Pricing
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="academicSessionId" className="text-sm font-medium">
                    Academic Session *
                  </label>
                  <select
                    id="academicSessionId"
                    name="academicSessionId"
                    required
                    defaultValue={plan?.academicSessionId}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select session</option>
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="curriculumTrackId" className="text-sm font-medium">
                    Curriculum Track *
                  </label>
                  <select
                    id="curriculumTrackId"
                    name="curriculumTrackId"
                    required
                    defaultValue={plan?.curriculumTrackId}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select track</option>
                    {tracks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="batchId" className="text-sm font-medium">
                    Batch (optional)
                  </label>
                  <select
                    id="batchId"
                    name="batchId"
                    defaultValue={plan?.batchId || ""}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All batches (track-wide)</option>
                    {batches
                      .filter((b) => !b.archivedAt)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="frequency" className="text-sm font-medium">
                    Frequency *
                  </label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as FeePlanFrequency)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="totalAmount" className="text-sm font-medium">
                    Total Amount *
                  </label>
                  <input
                    id="totalAmount"
                    name="totalAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={plan?.totalAmount?.toString()}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="e.g. 12000.00"
                  />
                </div>
                <div className="space-y-2 pt-7">
                  <label className="flex items-center space-x-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      name="showPublicly"
                      defaultChecked={plan?.showPublicly || false}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span>Show publicly on website</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Installments */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Installments
                </h3>
                <button
                  type="button"
                  onClick={addInstallment}
                  className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
                >
                  + Add Installment
                </button>
              </div>

              {totalFromInstalments > 0 && (
                <div className="text-xs text-muted-foreground">
                  Total from installments: ₹{totalFromInstalments.toFixed(2)}
                </div>
              )}

              {instalments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  {frequency === "CUSTOM"
                    ? "Custom plans require at least one installment."
                    : "Installments will be auto-generated based on frequency."}
                </p>
              )}

              <div className="space-y-3">
                {instalments.map((inst, index) => (
                  <div
                    key={index}
                    className="rounded-md border p-4 space-y-3 bg-muted/20"
                  >
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Installment #{index + 1}
                      </span>
                      {instalments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInstallment(index)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Label *
                        </label>
                        <input
                          type="text"
                          value={inst.label}
                          onChange={(e) =>
                            updateInstallment(index, "label", e.target.value)
                          }
                          placeholder="e.g. Term 1"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Amount *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={inst.amount}
                          onChange={(e) =>
                            updateInstallment(index, "amount", e.target.value)
                          }
                          placeholder="0.00"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) =>
                            updateInstallment(index, "dueDate", e.target.value)
                          }
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">
                          Offset (days)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={inst.dueOffsetDays}
                          onChange={(e) =>
                            updateInstallment(index, "dueOffsetDays", e.target.value)
                          }
                          placeholder="e.g. 30"
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </form>
        </div>

        <DialogFooter className="m-0 p-4 sm:p-6 border-t bg-muted/40">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton type="submit" form="fee-plan-form" pending={isPending}>
            {isPending ? "Saving..." : plan ? "Save Changes" : "Create Fee Plan"}
          </SubmitButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
