"use client";

import React, { useState } from "react";
import { AcademicSession } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Session
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Starts On</TableHead>
              <TableHead>Ends On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">
                  {session.name}
                  {session.archivedAt && (
                    <Badge variant="secondary" className="ml-2">
                      Archived
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {session.isActive ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Active
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Inactive</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {session.startsOn
                    ? new Date(session.startsOn).toLocaleDateString("en-GB")
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {session.endsOn
                    ? new Date(session.endsOn).toLocaleDateString("en-GB")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <SessionRowActions session={session} onEdit={() => handleEdit(session)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col space-y-4 md:hidden">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{session.name}</span>
              {session.isActive && (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  Active
                </Badge>
              )}
              {session.archivedAt && (
                <Badge variant="secondary">
                  Archived
                </Badge>
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
      </div>

      <SessionFormDialog
        session={editingSession}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
