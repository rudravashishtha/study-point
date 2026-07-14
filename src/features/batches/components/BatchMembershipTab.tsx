"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Batch, Enrolment, Student } from "@prisma/client";
import { Users, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddStudentToBatchDialog } from "@/features/enrolments/components/AddStudentToBatchDialog";
import { removeEnrolmentFromBatchAction } from "@/features/batches/actions/batch-actions";


type EnrolmentWithStudent = Enrolment & { student: Student };

export function BatchMembershipTab({
  batch,
  enrolments,
  isArchived,
}: {
  batch: Batch;
  enrolments: EnrolmentWithStudent[];
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  const handleRemove = (enrolmentId: string) => {
    if (
      !confirm(
        "Are you sure you want to remove this student from the batch? They will become unassigned.",
      )
    )
      return;

    startTransition(async () => {
      try {
        const result = await removeEnrolmentFromBatchAction(batch.id, enrolmentId);
        if (!result.success) {
          toast.error(result.error.message);
          return;
        }
        toast.success("Student removed from batch successfully");
        router.refresh();
      } catch {
        toast.error("Failed to remove student from batch");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border rounded-md p-4 bg-muted/20">
        <div>
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Users className="size-5" />
            Enrolled Students
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {enrolments.length} {enrolments.length === 1 ? "student" : "students"}{" "}
            currently assigned to this batch.
          </p>
        </div>
        {!isArchived && batch.isActive && (
          <Button onClick={() => setAddStudentOpen(true)}>Enrol Student</Button>
        )}
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrolments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No students are enrolled in this batch yet.
                </TableCell>
              </TableRow>
            ) : (
              enrolments.map((enrolment) => (
                <TableRow key={enrolment.id}>
                  <TableCell className="font-medium">
                    {enrolment.student.fullName}
                  </TableCell>
                  <TableCell>{enrolment.student.studentCode}</TableCell>
                  <TableCell>
                    {format(new Date(enrolment.joiningDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {enrolment.status === "active" ? (
                      <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                        Active
                      </Badge>
                    ) : enrolment.status === "suspended" ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : (
                      <Badge variant="secondary" className="capitalize">
                        {enrolment.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!isArchived && batch.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 gap-1"
                        onClick={() => handleRemove(enrolment.id)}
                        disabled={isPending}
                      >
                        <UserMinus className="size-4" />
                        <span className="sr-only sm:not-sr-only">Remove</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddStudentToBatchDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        batch={batch}
      />
    </div>
  );
}
