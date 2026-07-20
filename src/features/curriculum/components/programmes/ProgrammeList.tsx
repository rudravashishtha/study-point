"use client";

import React, { useState } from "react";
import { Programme, Board } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProgrammeRowActions } from "./ProgrammeRowActions";
import { ProgrammeFormDialog } from "./ProgrammeFormDialog";

type ProgrammeWithBoard = Programme & {
  board: { id: string; name: string; code: string; archivedAt: Date | null };
};

export function ProgrammeList({
  programmes,
  boards,
  emptyState,
}: {
  programmes: ProgrammeWithBoard[];
  boards: Board[];
  emptyState?: React.ReactNode;
}) {
  const [editingProgramme, setEditingProgramme] = useState<ProgrammeWithBoard | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (programme: ProgrammeWithBoard) => {
    setEditingProgramme(programme);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProgramme(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end items-center">
        <button
          onClick={handleCreate}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create Programme
        </button>
      </div>

      {programmes.length === 0 && emptyState ? emptyState : (
        <>
          {/* Desktop View */}
          <div className="hidden w-full overflow-auto rounded-md border md:block bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programmes.map((programme) => (
                  <TableRow key={programme.id}>
                    <TableCell className="font-medium">{programme.code}</TableCell>
                    <TableCell>{programme.name}</TableCell>
                    <TableCell>
                      {programme.board.name} ({programme.board.code})
                      {programme.board.archivedAt && (
                        <Badge variant="outline" className="ml-2">
                          Archived Board
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {programme.archivedAt ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <ProgrammeRowActions
                        programme={programme}
                        onEdit={() => handleEdit(programme)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="flex flex-col space-y-4 md:hidden">
            {programmes.map((programme) => (
              <div
                key={programme.id}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{programme.name}</span>
                  {programme.archivedAt ? (
                    <Badge variant="secondary">Archived</Badge>
                  ) : (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Active
                    </Badge>
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
          </div>
        </>
      )}

      <ProgrammeFormDialog
        programme={editingProgramme}
        boards={boards}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
      />
    </div>
  );
}
