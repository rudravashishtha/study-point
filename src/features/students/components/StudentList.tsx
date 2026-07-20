"use client";

import React, { useState } from "react";
import { Student } from "@prisma/client";
import { Archive, ArchiveRestore, Loader2, Pencil, Power } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { archiveStudentAction, restoreStudentAction } from "@/app/admin/students/actions";
import { inviteStudentAction } from "@/app/admin/students/activate/actions";
import { toast } from "sonner";
import { StudentFormDialog } from "./StudentFormDialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function StudentList({ students }: { students: Student[] }) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const handleArchive = async () => {
    if (!archiveConfirmId) return;
    setProcessingId(archiveConfirmId);
    const res = await archiveStudentAction(archiveConfirmId);
    setProcessingId(null);
    setArchiveConfirmId(null);
    if (!res.success) {
      toast.error("Error", { description: res.error });
    } else {
      toast.success("Success", { description: "Student archived successfully." });
    }
  };

  const handleRestore = async (id: string) => {
    setProcessingId(id);
    const res = await restoreStudentAction(id);
    setProcessingId(null);
    if (!res.success) {
      toast.error("Error", { description: res.error });
    } else {
      toast.success("Success", { description: "Student archived successfully." });
    }
  };

  const handleActivate = async (id: string) => {
    setProcessingId(id);
    const res = await inviteStudentAction(id);
    setProcessingId(null);
    if (!res.success) {
      toast.error("Error", { description: res.error });
    } else {
      toast.success("Success", { description: "Invitation sent successfully." });
    }
  };

  const archiveTarget = archiveConfirmId
    ? students.find((s) => s.id === archiveConfirmId)
    : null;

  return (
    <>
      <div className="rounded-md border bg-card w-full overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Code</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student.id}
                className={student.archivedAt ? "opacity-60 bg-muted/30" : ""}
              >
                <TableCell className="font-mono text-xs">{student.studentCode}</TableCell>
                <TableCell className="font-medium">
                  {student.fullName}
                  {student.email && (
                    <div className="text-xs text-muted-foreground font-normal">
                      {student.email}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                    {student.accountStatus}
                  </span>
                </TableCell>
                <TableCell>
                  {student.joiningDate
                    ? new Date(student.joiningDate).toLocaleDateString("en-GB")
                    : "-"}
                </TableCell>
                <TableCell>
                  {student.archivedAt ? (
                    <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      Archived
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell className="flex items-center justify-end space-x-2">
                  {!student.archivedAt ? (
                    <>
                      {student.accountStatus === "none" && (
                        <button
                          onClick={() => handleActivate(student.id)}
                          disabled={processingId === student.id}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                          title="Activate account"
                        >
                          {processingId === student.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                          <span className="sr-only">Activate account</span>
                        </button>
                      )}
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </button>
                      <button
                        onClick={() => setArchiveConfirmId(student.id)}
                        disabled={processingId === student.id}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Archive"
                      >
                        {processingId === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Archive className="h-4 w-4" />
                        )}
                        <span className="sr-only">Archive</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestore(student.id)}
                      disabled={processingId === student.id}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted disabled:opacity-50"
                      title="Restore"
                    >
                      {processingId === student.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArchiveRestore className="h-4 w-4" />
                      )}
                      <span className="sr-only">Restore</span>
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!archiveConfirmId}
        onOpenChange={(open) => !open && setArchiveConfirmId(null)}
        title="Archive student?"
        description={
          archiveTarget
            ? `Are you sure you want to archive "${archiveTarget.fullName}"? They can be restored later.`
            : ""
        }
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <StudentFormDialog
        student={editingStudent || undefined}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      />
    </>
  );
}
