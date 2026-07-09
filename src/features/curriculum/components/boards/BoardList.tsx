"use client";

import React, { useState } from "react";
import { Board } from "@prisma/client";
import { DataListTableShell } from "@/components/admin/data-list/DataListTableShell";
import { DataListMobileShell } from "@/components/admin/data-list/DataListMobileShell";
import { BoardRowActions } from "./BoardRowActions";
import { BoardFormDialog } from "./BoardFormDialog";

export function BoardList({ boards }: { boards: Board[] }) {
  const [editingBoard, setEditingBoard] = useState<Board | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (board: Board) => {
    setEditingBoard(board);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingBoard(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Boards</h2>
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Board
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
        {boards.map((board) => (
          <tr key={board.id} className="border-b transition-colors hover:bg-muted/50">
            <td className="p-4 font-medium">{board.code}</td>
            <td className="p-4">{board.name}</td>
            <td className="p-4">
              {board.archivedAt ? (
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
              <BoardRowActions board={board} onEdit={() => handleEdit(board)} />
            </td>
          </tr>
        ))}
      </DataListTableShell>

      <DataListMobileShell>
        {boards.map((board) => (
          <div
            key={board.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{board.name}</span>
              {board.archivedAt ? (
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
              <div>Code: {board.code}</div>
            </div>
            <div className="flex justify-end pt-2 border-t">
              <BoardRowActions board={board} onEdit={() => handleEdit(board)} />
            </div>
          </div>
        ))}
      </DataListMobileShell>

      <BoardFormDialog
        board={editingBoard}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
