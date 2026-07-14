"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { confirmFeeAssignmentAction } from "@/app/admin/fee-assignments/actions";
import { useRouter } from "next/navigation";
import type {
  FeeAssignmentTargetInput,
  ConfirmFeeAssignmentResult,
} from "@/server/services/fee-assignments";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {!result ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm Fee Assignment</DialogTitle>
              <DialogDescription>
                This will create fee assignments for <strong>{validCount}</strong>{" "}
                enrolment(s). This action cannot be undone automatically.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleConfirm} disabled={submitting}>
                {submitting ? "Creating..." : "Confirm Assignment"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Assignment Complete</DialogTitle>
            </DialogHeader>
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
            <DialogFooter>
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setResult(null);
                }}
              >
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
