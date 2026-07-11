"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { confirmFeeAssignmentAction } from "@/app/admin/fee-assignments/actions";
import { useRouter } from "next/navigation";
import type {
  FeeAssignmentTargetInput,
  ConfirmFeeAssignmentResult,
} from "@/server/services/fee-assignments";

export function FeeAssignmentConfirmDialog({
  open,
  onOpenChange,
  input,
  validCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: FeeAssignmentTargetInput;
  validCount: number;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ConfirmFeeAssignmentResult | null>(null);

  if (!open) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await confirmFeeAssignmentAction(input);
      if (!res.success) {
        toast.error(res.error);
        setSubmitting(false);
        return;
      }
      const data = res.data!;
      setResult(data);
      toast.success(
        `Created ${data.created}, skipped ${data.skipped}, failed ${data.failed}`,
      );
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-md border bg-background p-6 shadow-lg">
        {!result ? (
          <>
            <h2 className="mb-4 text-lg font-semibold">Confirm Fee Assignment</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will create fee assignments for <strong>{validCount}</strong>{" "}
              enrolment(s). This action cannot be undone automatically.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
                className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Confirm Assignment"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold">Assignment Complete</h2>
            <div className="space-y-3">
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                <span className="font-medium">{result.created}</span> assignment(s)
                created
              </div>
              {result.skipped > 0 && (
                <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                  <span className="font-medium">{result.skipped}</span> existing
                  assignment(s) skipped
                </div>
              )}
              {result.failed > 0 && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  <span className="font-medium">{result.failed}</span> assignment(s)
                  failed
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setResult(null);
                }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
