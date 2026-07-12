"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TeacherAssignment } from "@prisma/client";
import { removeTeacherAssignmentAction } from "../../actions/batch-actions";
import { toast } from "sonner";
import { EditAssignmentDialog } from "./EditAssignmentDialog";

export interface AssignmentRowActionsProps {
  batchId: string;
  assignment: TeacherAssignment & { teacher: { displayName: string } };
  disabled?: boolean;
}

export function AssignmentRowActions({
  batchId,
  assignment,
  disabled,
}: AssignmentRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${assignment.teacher.displayName} from this batch?`,
      )
    )
      return;

    setIsProcessing(true);
    try {
      const result = await removeTeacherAssignmentAction(batchId, assignment.id);

      if (result.error) {
        toast.error("Action Failed", {
          description: result.error,
        });
      } else {
        toast.success("Success", {
          description: `Teacher removed successfully.`,
        });
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={disabled || isProcessing}
            />
          }
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Permissions
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleRemove}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Assignment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAssignmentDialog
        batchId={batchId}
        assignment={assignment}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </>
  );
}
