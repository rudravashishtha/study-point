"use client";

import React, { useState } from "react";
import { Subject } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Subject
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.code}</TableCell>
                <TableCell>{subject.name}</TableCell>
                <TableCell>
                  {subject.archivedAt ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <SubjectRowActions subject={subject} onEdit={() => handleEdit(subject)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col space-y-4 md:hidden">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{subject.name}</span>
              {subject.archivedAt ? (
                <Badge variant="secondary">Archived</Badge>
              ) : (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
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
      </div>

      <SubjectFormDialog
        subject={editingSubject}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
