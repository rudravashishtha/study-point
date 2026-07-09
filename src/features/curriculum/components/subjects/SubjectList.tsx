"use client";

import React, { useState } from "react";
import { Subject } from "@prisma/client";
import { DataListTableShell } from "@/components/admin/data-list/DataListTableShell";
import { DataListMobileShell } from "@/components/admin/data-list/DataListMobileShell";
import { SubjectRowActions } from "./SubjectRowActions";
import { SubjectFormDialog } from "./SubjectFormDialog";

export function SubjectList({ subjects }: { subjects: Subject[] }) {
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingSubject(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Subjects</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Subject
        </button>
      </div>

      <DataListTableShell
        headers={
          <>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Code
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Name
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-10 px-4 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </>
        }
      >
        {subjects.map((subject) => (
          <tr key={subject.id} className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 font-medium">{subject.code}</td>
            <td className="p-4">{subject.name}</td>
            <td className="p-4">
              {subject.archivedAt ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Archived
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              )}
            </td>
            <td className="p-4 text-right">
              <SubjectRowActions subject={subject} onEdit={() => handleEdit(subject)} />
            </td>
          </tr>
        ))}
      </DataListTableShell>

      <DataListMobileShell>
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{subject.name}</span>
              {subject.archivedAt ? (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Archived
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <div>Code: {subject.code}</div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <SubjectRowActions subject={subject} onEdit={() => handleEdit(subject)} />
            </div>
          </div>
        ))}
      </DataListMobileShell>

      <SubjectFormDialog
        subject={editingSubject}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
