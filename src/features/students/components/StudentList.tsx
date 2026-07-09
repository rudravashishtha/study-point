"use client";

import React, { useState } from "react";
import { Student } from "@prisma/client";
import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import { archiveStudentAction, restoreStudentAction } from "@/app/admin/students/actions";
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

  return (
    <>
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left font-medium text-muted-foreground">
                <th className="p-4">Student Code</th>
                <th className="p-4">Full Name</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Joining Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className={`border-b last:border-0 ${
                    student.archivedAt ? "opacity-60 bg-muted/30" : ""
                  }`}
                >
                  <td className="p-4 font-mono text-xs">{student.studentCode}</td>
                  <td className="p-4 font-medium">
                    {student.fullName}
                    {student.email && (
                      <div className="text-xs text-muted-foreground font-normal">
                        {student.email}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {student.accountStatus}
                    </span>
                  </td>
                  <td className="p-4">
                    {student.joiningDate
                      ? new Date(student.joiningDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                  <td className="p-4">
                    {student.archivedAt ? (
                      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                        Archived
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="p-4 flex items-center justify-end space-x-2">
                    {!student.archivedAt ? (
                      <>
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <StudentFormDialog
        student={editingStudent || undefined}
        open={!!editingStudent}
        onOpenChange={(open) => !open && setEditingStudent(null)}
      />
    </>
  );
}
