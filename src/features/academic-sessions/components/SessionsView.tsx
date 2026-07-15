"use client";

import React, { useState } from "react";
import { AcademicSession } from "@prisma/client";
import { SessionList } from "./SessionList";
import { SessionFormDialog } from "./SessionFormDialog";
import { DataListEmpty } from "@/components/admin/data-list/DataListEmpty";

export function SessionsView({ sessions }: { sessions: AcademicSession[] }) {
  const [editingSession, setEditingSession] = useState<AcademicSession | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreate = () => {
    setEditingSession(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (session: AcademicSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <DataListEmpty title="No academic sessions found." />
      ) : (
        <SessionList sessions={sessions} onEdit={handleEdit} />
      )}

      <SessionFormDialog
        session={editingSession}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
