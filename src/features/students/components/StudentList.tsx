"use client";

import React, { useState } from "react";
import { Student } from "@prisma/client";
import { Archive, ArchiveRestore, Pencil, Power } from "lucide-react";
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

export function StudentList({ students }: { students: Student[] }) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to archive this student?")) return;
    const res = await archiveStudentAction(id);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success("Student archived successfully.");
    }
  };

  const handleRestore = async (id: string) => {
    const res = await restoreStudentAction(id);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success("Student restored successfully.");
    }
  };

  const handleActivate = async (id: string) => {
    const res = await inviteStudentAction(id);
    if (!res.success) {
      toast.error(res.error);
    } else {
      toast.success("Invitation sent successfully.");
    }
  };

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
                          className="flex h-8 w-8 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                          title="Activate account"
                        >
                          <Power className="h-4 w-4" />
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
                        onClick={() => handleArchive(student.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                        <span className="sr-only">Archive</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestore(student.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                      title="Restore"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      <span className="sr-only">Restore</span>
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StudentFormDialog
        student={editingStudent || undefined}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      />
    </>
  );
}
