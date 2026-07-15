"use client";

import { useState } from "react";
import { StudentActivationCandidate } from "@/server/services/provisioning";
import { InviteStudentButton } from "./InviteStudentButton";
import {
  bulkInviteStudentsAction,
  resetStudentInvitationAction,
} from "@/app/admin/students/activate/actions";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";
import { RotateCcw } from "lucide-react";

interface StudentActivationQueueProps {
  candidates: StudentActivationCandidate[];
}

export function StudentActivationQueue({ candidates }: StudentActivationQueueProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <DataListEmpty
        title="No students to activate"
        description="All eligible students have already been invited or there are no unprovisioned students."
      />
    );
  }

  const eligibleIds = candidates
    .filter((c) => c.isEligible && c.invitationStatus === "none")
    .map((c) => c.id);
  const allSelected =
    eligibleIds.length > 0 && eligibleIds.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(eligibleIds));

  const handleBulkInvite = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    setIsBulkPending(true);
    try {
      const result = await bulkInviteStudentsAction(ids);
      if (!result.success) {
        toast.error("Some invitations failed", { description: result.error });
      } else {
        toast.success(`Invited ${ids.length} student${ids.length === 1 ? "" : "s"}.`);
        setSelected(new Set());
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleReset = async (studentId: string) => {
    setResettingId(studentId);
    try {
      const result = await resetStudentInvitationAction(studentId);
      if (!result.success) {
        toast.error("Reset failed", { description: result.error });
      } else {
        toast.success("Invitation reset. You can now correct the email and re-invite.");
      }
    } catch (error: unknown) {
      toast.error("Reset failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setResettingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  aria-label="Select all eligible"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={eligibleIds.length === 0}
                />
              </TableHead>
              <TableHead>Student Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  {candidate.invitationStatus === "none" && (
                    <input
                      type="checkbox"
                      aria-label={`Select ${candidate.fullName}`}
                      checked={selected.has(candidate.id)}
                      onChange={() => toggle(candidate.id)}
                      disabled={!candidate.isEligible}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{candidate.studentCode}</TableCell>
                <TableCell>{candidate.fullName}</TableCell>
                <TableCell>
                  {candidate.email ? (
                    candidate.email
                  ) : (
                    <span className="text-muted-foreground italic">
                      No email provided
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {candidate.invitationStatus === "invited" ? (
                    <Badge variant="secondary">Invitation Pending</Badge>
                  ) : candidate.isEligible ? (
                    <Badge variant="default">Eligible</Badge>
                  ) : (
                    <Badge variant="destructive">Ineligible (Missing Email)</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {candidate.invitationStatus === "invited" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReset(candidate.id)}
                      disabled={resettingId === candidate.id}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {resettingId === candidate.id ? "Resetting..." : "Reset"}
                    </Button>
                  ) : (
                    <InviteStudentButton
                      studentId={candidate.id}
                      isEligible={candidate.isEligible}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={handleBulkInvite}
          disabled={selected.size === 0 || isBulkPending}
        >
          {isBulkPending ? "Inviting..." : `Invite selected (${selected.size})`}
        </Button>
      </div>
    </div>
  );
}
