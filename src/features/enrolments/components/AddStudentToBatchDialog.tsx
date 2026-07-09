"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Batch } from "@prisma/client";
import { Search, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  lookupStudentByCodeAction,
  resolveStudentBatchMembershipAction,
  createEnrolmentForBatchAction,
  assignEnrolmentToBatchAction,
} from "@/features/batches/actions/batch-actions";

type MembershipStatus = {
  state: "UNENROLLED" | "UNASSIGNED" | "ALREADY_IN_BATCH" | "ASSIGNED_ELSEWHERE";
  enrolment?: { id: string; batchId: string | null; batch?: { name: string } | null };
};

type FoundStudent = { id: string; studentCode: string; fullName: string };

export function AddStudentToBatchDialog({
  open,
  onOpenChange,
  batch,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: Batch;
}) {
  const [isPending, startTransition] = useTransition();
  const [studentCode, setStudentCode] = useState("");
  const [foundStudent, setFoundStudent] = useState<FoundStudent | null>(null);
  const [membership, setMembership] = useState<MembershipStatus | null>(null);

  const handleSearch = () => {
    if (!studentCode.trim()) return;

    startTransition(async () => {
      setFoundStudent(null);
      setMembership(null);

      const lookupResult = await lookupStudentByCodeAction(studentCode.trim());
      if (!lookupResult.success) {
        toast.error(lookupResult.error.message || "Student not found");
        return;
      }

      const student = lookupResult.data;
      setFoundStudent(student);

      const membershipResult = await resolveStudentBatchMembershipAction(
        batch.id,
        student.id,
      );
      if (!membershipResult.success) {
        toast.error(
          membershipResult.error.message || "Failed to resolve membership status",
        );
        return;
      }

      setMembership(membershipResult.data as MembershipStatus);
    });
  };

  const handleConfirm = () => {
    if (!foundStudent || !membership) return;

    startTransition(async () => {
      let result;
      if (membership.state === "UNENROLLED") {
        result = await createEnrolmentForBatchAction(batch.id, foundStudent.id);
      } else if (membership.state === "UNASSIGNED" && membership.enrolment) {
        result = await assignEnrolmentToBatchAction(batch.id, membership.enrolment.id);
      } else {
        return; // Should not reach here
      }

      if (!result.success) {
        toast.error(result.error.message || "Failed to enrol student");
        return;
      }

      toast.success("Student enrolled in batch successfully");
      resetAndClose();
    });
  };

  const resetAndClose = () => {
    setStudentCode("");
    setFoundStudent(null);
    setMembership(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAndClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enrol Student in Batch</DialogTitle>
          <DialogDescription>
            Search for a student by their code to assign them to this batch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-end gap-2">
            <div className="grid gap-2 flex-1">
              <Label htmlFor="studentCode">Student Code</Label>
              <Input
                id="studentCode"
                placeholder="e.g. STU-2026-0001"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                disabled={isPending}
              />
            </div>
            <Button onClick={handleSearch} disabled={isPending || !studentCode.trim()}>
              <Search className="size-4 mr-2" />
              Search
            </Button>
          </div>

          {foundStudent && membership && (
            <div className="border rounded-md p-4 bg-muted/30 mt-2 space-y-3">
              <div>
                <p className="text-sm font-medium">Student Found</p>
                <p className="text-lg">{foundStudent.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {foundStudent.studentCode}
                </p>
              </div>

              <div className="pt-2 border-t">
                {membership.state === "ALREADY_IN_BATCH" && (
                  <div className="flex items-start gap-2 text-green-600">
                    <UserCheck className="size-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Already in this batch</p>
                      <p className="text-sm">
                        This student is already enrolled in this batch.
                      </p>
                    </div>
                  </div>
                )}
                {membership.state === "ASSIGNED_ELSEWHERE" && (
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertCircle className="size-5 mt-0.5" />
                    <div>
                      <p className="font-medium">Assigned to another batch</p>
                      <p className="text-sm">
                        This student is currently assigned to{" "}
                        <strong>
                          {membership.enrolment?.batch?.name || "another batch"}
                        </strong>
                        . Cross-batch transfers are not supported in this dialog.
                      </p>
                    </div>
                  </div>
                )}
                {membership.state === "UNENROLLED" && (
                  <div className="text-sm">
                    <p>
                      The student is not enrolled in this curriculum track for this
                      session.
                    </p>
                    <p className="mt-1 font-medium text-primary">
                      They will be enrolled and assigned to this batch.
                    </p>
                  </div>
                )}
                {membership.state === "UNASSIGNED" && (
                  <div className="text-sm">
                    <p>
                      The student is enrolled in this curriculum track but not assigned to
                      any batch.
                    </p>
                    <p className="mt-1 font-medium text-primary">
                      Their enrolment will be assigned to this batch.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              isPending ||
              !membership ||
              membership.state === "ALREADY_IN_BATCH" ||
              membership.state === "ASSIGNED_ELSEWHERE"
            }
          >
            {isPending ? "Processing..." : "Confirm Enrolment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
