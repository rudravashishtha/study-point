"use client";

import React, { useState } from "react";
import { AcademicSession } from "@prisma/client";
import { DataListTableShell } from "@/components/admin/data-list/DataListTableShell";
import { DataListMobileShell } from "@/components/admin/data-list/DataListMobileShell";
import { SessionRowActions } from "./SessionRowActions";
import { SessionFormDialog } from "./SessionFormDialog";

export function SessionList({ sessions }: { sessions: AcademicSession[] }) {
  const [editingSession, setEditingSession] = useState<AcademicSession | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (session: AcademicSession) => {
    setEditingSession(session);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingSession(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Academic Sessions</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Session
        </button>
      </div>

      <DataListTableShell
        headers={
          <>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Name
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Starts On
            </th>
            <th className="h-10 px-4 text-left font-medium text-muted-foreground">
              Ends On
            </th>
            <th className="h-10 px-4 text-right font-medium text-muted-foreground">
              Actions
            </th>
          </>
        }
      >
        {sessions.map((session) => (
          <tr key={session.id} className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 font-medium">
              {session.name}
              {session.archivedAt && (
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Archived
                </span>
              )}
            </td>
            <td className="p-4">
              {session.isActive ? (
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Inactive</span>
              )}
            </td>
            <td className="p-4 text-sm text-muted-foreground">
              {session.startsOn
                ? new Date(session.startsOn).toLocaleDateString("en-GB")
                : "-"}
            </td>
            <td className="p-4 text-sm text-muted-foreground">
              {session.endsOn
                ? new Date(session.endsOn).toLocaleDateString("en-GB")
                : "-"}
            </td>
            <td className="p-4 text-right">
              <SessionRowActions session={session} onEdit={() => handleEdit(session)} />
            </td>
          </tr>
        ))}
      </DataListTableShell>

      <DataListMobileShell>
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{session.name}</span>
              {session.isActive && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Active
                </span>
              )}
              {session.archivedAt && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  Archived
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mb-4 space-y-1">
              <div>
                Start:{" "}
                {session.startsOn
                  ? new Date(session.startsOn).toLocaleDateString("en-GB")
                  : "-"}
              </div>
              <div>
                End:{" "}
                {session.endsOn
                  ? new Date(session.endsOn).toLocaleDateString("en-GB")
                  : "-"}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <SessionRowActions session={session} onEdit={() => handleEdit(session)} />
            </div>
          </div>
        ))}
      </DataListMobileShell>

      <SessionFormDialog
        session={editingSession}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
