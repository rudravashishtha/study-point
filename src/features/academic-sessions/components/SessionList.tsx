"use client";

import React from "react";
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

export function SessionList({
  sessions,
  onEdit,
}: {
  sessions: AcademicSession[];
  onEdit: (session: AcademicSession) => void;
}) {
  return (
    <div className="space-y-4">
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
                  <SessionRowActions session={session} onEdit={() => onEdit(session)} />
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
              {session.archivedAt && <Badge variant="secondary">Archived</Badge>}
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
              <SessionRowActions session={session} onEdit={() => onEdit(session)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
