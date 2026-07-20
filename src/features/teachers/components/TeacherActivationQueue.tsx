"use client";

import { useState } from "react";
import { TeacherActivationCandidate } from "@/server/services/provisioning";
import {
  inviteTeacherFromQueueAction,
  bulkInviteTeachersAction,
  resetTeacherInvitationAction,
} from "@/app/admin/teachers/activate/actions";
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
import { Power, RotateCcw } from "lucide-react";

interface TeacherActivationQueueProps {
  candidates: TeacherActivationCandidate[];
}

export function TeacherActivationQueue({ candidates }: TeacherActivationQueueProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  if (candidates.length === 0) {
    return (
      <DataListEmpty
        title="No teachers to activate"
        description="All eligible teachers have already been invited or there are no unprovisioned teachers."
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
    const toastId = toast.loading(`Inviting ${ids.length} teacher${ids.length === 1 ? "" : "s"}...`);
    try {
      const result = await bulkInviteTeachersAction(ids);
      if (!result.success) {
        toast.error("Some invitations failed", { description: result.error, id: toastId });
      } else {
        toast.success("Success", { description: `Invited ${ids.length} teacher${ids.length === 1 ? "" : "s"}.`, id: toastId });
        setSelected(new Set());
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
        id: toastId,
      });
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleInvite = async (teacherId: string) => {
    setPendingId(teacherId);
    try {
      const result = await inviteTeacherFromQueueAction(teacherId);
      if (!result.success) {
        toast.error("Invite failed", { description: result.error });
      } else {
        toast.success("Success", { description: "Teacher invited successfully." });
      }
    } catch (error: unknown) {
      toast.error("Invite failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setPendingId(null);
    }
  };

  const handleReset = async (teacherId: string) => {
    setResettingId(teacherId);
    try {
      const result = await resetTeacherInvitationAction(teacherId);
      if (!result.success) {
        toast.error("Reset failed", { description: result.error });
      } else {
        toast.success("Success", { description: "Invitation reset. You can now re-invite this teacher." });
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
                      aria-label={`Select ${candidate.displayName}`}
                      checked={selected.has(candidate.id)}
                      onChange={() => toggle(candidate.id)}
                      disabled={!candidate.isEligible}
                    />
                  )}
                </TableCell>
                <TableCell className="font-medium">{candidate.displayName}</TableCell>
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
                    <Button
                      variant={candidate.isEligible ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleInvite(candidate.id)}
                      disabled={!candidate.isEligible || pendingId === candidate.id}
                    >
                      <Power className="mr-2 h-4 w-4" />
                      {pendingId === candidate.id ? "Inviting..." : "Invite"}
                    </Button>
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
