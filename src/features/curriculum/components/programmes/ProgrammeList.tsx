"use client";

import React, { useState } from "react";
import { Programme, Board } from "@prisma/client";
import { DataListTableShell } from "@/components/admin/data-list/DataListTableShell";
import { DataListMobileShell } from "@/components/admin/data-list/DataListMobileShell";
import { ProgrammeRowActions } from "./ProgrammeRowActions";
import { ProgrammeFormDialog } from "./ProgrammeFormDialog";

export function ProgrammeList({
  programmes,
  boards,
}: {
  programmes: (Programme & {
    board: { id: string; name: string; code: string; archivedAt: Date | null };
  })[];
  boards: Board[];
}) {
  const [editingProgramme, setEditingProgramme] = useState<Programme | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (programme: Programme) => {
    setEditingProgramme(programme);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProgramme(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Programmes</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Programme
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
              Board
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
        {programmes.map((programme) => (
          <tr key={programme.id} className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 font-medium">{programme.code}</td>
            <td className="p-4">{programme.name}</td>
            <td className="p-4">
              {programme.board.name} ({programme.board.code})
              {programme.board.archivedAt && (
                <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  Archived Board
                </span>
              )}
            </td>
            <td className="p-4">
              {programme.archivedAt ? (
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
              <ProgrammeRowActions
                programme={programme}
                onEdit={() => handleEdit(programme)}
              />
            </td>
          </tr>
        ))}
      </DataListTableShell>

      <DataListMobileShell>
        {programmes.map((programme) => (
          <div
            key={programme.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{programme.name}</span>
              {programme.archivedAt ? (
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
              <div>Code: {programme.code}</div>
              <div>
                Board: {programme.board.name} ({programme.board.code})
                {programme.board.archivedAt && (
                  <span className="ml-2 text-xs">(Archived Board)</span>
                )}
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <ProgrammeRowActions
                programme={programme}
                onEdit={() => handleEdit(programme)}
              />
            </div>
          </div>
        ))}
      </DataListMobileShell>

      <ProgrammeFormDialog
        programme={editingProgramme}
        boards={boards}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
