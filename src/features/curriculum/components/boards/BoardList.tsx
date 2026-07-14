"use client";

import React, { useState } from "react";
import { Board } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Board
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
            {boards.map((board) => (
              <TableRow key={board.id}>
                <TableCell className="font-medium">{board.code}</TableCell>
                <TableCell>{board.name}</TableCell>
                <TableCell>
                  {board.archivedAt ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <BoardRowActions board={board} onEdit={() => handleEdit(board)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile View */}
      <div className="flex flex-col space-y-4 md:hidden">
        {boards.map((board) => (
          <div
            key={board.id}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{board.name}</span>
              {board.archivedAt ? (
                <Badge variant="secondary">Archived</Badge>
              ) : (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active</Badge>
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
      </div>

      <BoardFormDialog
        board={editingBoard}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
