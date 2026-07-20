"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Batch } from "@prisma/client";
import { Search, UserCheck, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listActiveStudentsAction,
  resolveStudentBatchMembershipAction,
  createEnrolmentForBatchAction,
  assignEnrolmentToBatchAction,
} from "@/features/batches/actions/batch-actions";

type MembershipStatus = {
  state: "UNENROLLED" | "UNASSIGNED" | "ALREADY_IN_BATCH" | "ASSIGNED_ELSEWHERE";
  enrolment?: { id: string; batchId: string | null; batch?: { name: string } | null };
};

type Student = { id: string; studentCode: string; fullName: string };

type ResolvedStudent = {
  student: Student;
  membership: MembershipStatus;
};

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
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolved, setResolved] = useState<ResolvedStudent[] | null>(null);
  const abortRef = useRef(0);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const generation = ++abortRef.current;

    listActiveStudentsAction().then((result) => {
      if (!cancelled && generation === abortRef.current && result.success) {
        setStudents(result.data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      listActiveStudentsAction(searchQuery || undefined).then((result) => {
        if (!cancelled && result.success) {
          setStudents(result.data);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, open]);

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  };

  const handleResolve = () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const results: ResolvedStudent[] = [];
      const selected = students.filter((s) => selectedIds.has(s.id));

      for (const student of selected) {
        const membershipResult = await resolveStudentBatchMembershipAction(
          batch.id,
          student.id,
        );
        if (membershipResult.success) {
          results.push({
            student,
            membership: membershipResult.data as MembershipStatus,
          });
        }
      }

      setResolved(results);
    });
  };

  const handleConfirm = () => {
    if (!resolved) return;

    startTransition(async () => {
      let enrolled = 0;
      let skipped = 0;

      for (const { student, membership } of resolved) {
        if (membership.state === "ALREADY_IN_BATCH" || membership.state === "ASSIGNED_ELSEWHERE") {
          skipped++;
          continue;
        }

        let result;
        if (membership.state === "UNENROLLED") {
          result = await createEnrolmentForBatchAction(batch.id, student.id);
        } else if (membership.state === "UNASSIGNED" && membership.enrolment) {
          result = await assignEnrolmentToBatchAction(batch.id, membership.enrolment.id);
        } else {
          skipped++;
          continue;
        }

        if (result.success) {
          enrolled++;
        } else {
          skipped++;
        }
      }

      if (enrolled > 0) {
        toast.success("Success", {
          description: `${enrolled} student${enrolled === 1 ? "" : "s"} enrolled successfully${skipped > 0 ? `. ${skipped} skipped.` : ""}`,
        });
      } else {
        toast.error("Error", { description: "No students could be enrolled." });
      }

      resetAndClose();
    });
  };

  const resetAndClose = () => {
    setSearchQuery("");
    setSelectedIds(new Set());
    setResolved(null);
    setStudents([]);
    onOpenChange(false);
  };

  const canEnroll = resolved?.some(
    (r) => r.membership.state === "UNENROLLED" || r.membership.state === "UNASSIGNED",
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAndClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>Enrol Students in Batch</DialogTitle>
          <DialogDescription>
            {resolved
              ? "Review the enrolment status for each student."
              : "Select students to assign them to this batch."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col px-4 py-4 sm:px-6 gap-4">
          {/* Search — only visible during selection */}
          {!resolved && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                disabled={isPending}
              />
            </div>
          )}

          {/* Selection summary bar */}
          {!resolved && selectedIds.size > 0 && (
            <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
              <span className="font-medium">{selectedIds.size} selected</span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-muted-foreground hover:text-foreground underline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Student list with checkboxes */}
          {!resolved && (
            <div className="flex-1 overflow-y-auto border rounded-md min-h-0 max-h-[50vh]">
              {students.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No students match your search." : "No active students found."}
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="w-full text-left px-4 py-2.5 border-b bg-muted/30 hover:bg-muted/50 transition-colors flex items-center gap-3 text-sm font-medium"
                  >
                    <div
                      className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedIds.size === students.length && students.length > 0
                          ? "bg-primary border-primary text-primary-foreground"
                          : selectedIds.size > 0
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/50"
                      }`}
                    >
                      {selectedIds.size === students.length && students.length > 0 ? (
                        <Check className="size-3" />
                      ) : selectedIds.size > 0 ? (
                        <div className="size-1.5 bg-primary-foreground rounded-sm" />
                      ) : null}
                    </div>
                    Select all
                  </button>
                  {students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => toggleStudent(student.id)}
                      disabled={isPending}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center gap-3 border-b last:border-b-0"
                    >
                      <div
                        className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                          selectedIds.has(student.id)
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/50"
                        }`}
                      >
                        {selectedIds.has(student.id) && <Check className="size-3" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Resolved summary */}
          {resolved && (
            <div className="flex-1 overflow-y-auto border rounded-md divide-y min-h-0 max-h-[50vh]">
              {resolved.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No students were resolved.
                </div>
              ) : (
                resolved.map(({ student, membership }) => (
                  <div
                    key={student.id}
                    className="px-4 py-3 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{student.fullName}</p>
                      <p className="text-xs text-muted-foreground">{student.studentCode}</p>
                    </div>
                    <div className="shrink-0">
                      {membership.state === "ALREADY_IN_BATCH" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <UserCheck className="size-3.5" /> Already in batch
                        </span>
                      )}
                      {membership.state === "ASSIGNED_ELSEWHERE" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertCircle className="size-3.5" />{" "}
                          {membership.enrolment?.batch?.name || "In another batch"}
                        </span>
                      )}
                      {membership.state === "UNENROLLED" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Check className="size-3.5" /> Will enrol + assign
                        </span>
                      )}
                      {membership.state === "UNASSIGNED" && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Check className="size-3.5" /> Will assign
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          {resolved ? (
            <>
              <Button variant="outline" onClick={() => setResolved(null)} disabled={isPending}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isPending || !canEnroll}>
                {isPending
                  ? "Processing..."
                  : `Confirm (${resolved.filter((r) => r.membership.state === "UNENROLLED" || r.membership.state === "UNASSIGNED").length})`}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetAndClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={isPending || selectedIds.size === 0}
              >
                {isPending ? "Checking..." : `Enrol Selected (${selectedIds.size})`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
