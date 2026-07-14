"use client";

import { useState } from "react";
import { PermissionCapability, TeacherAssignment } from "@prisma/client";
import { updateTeacherPermissionsAction } from "../../actions/batch-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PermissionSelector } from "./PermissionSelector";
import { Label } from "@/components/ui/label";

interface EditAssignmentDialogProps {
  batchId: string;
  assignment: TeacherAssignment & { teacher: { displayName: string } };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAssignmentDialog({
  batchId,
  assignment,
  open,
  onOpenChange,
}: EditAssignmentDialogProps) {
  const [permissions, setPermissions] = useState<PermissionCapability[]>(
    assignment.permissions,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (permissions.length === 0 || !permissions.includes("BATCH_VIEW")) {
      toast.error("Validation Error", {
        description: "You must explicitly select at least BATCH_VIEW.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateTeacherPermissionsAction(
        batchId,
        assignment.id,
        permissions,
      );

      if (result.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Success", { description: "Permissions updated successfully." });
        onOpenChange(false);
      }
    } catch (e: unknown) {
      toast.error("Error", {
        description: e instanceof Error ? e.message : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>Edit Permissions for {assignment.teacher.displayName}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-2">
            <Label>
              Capabilities <span className="text-red-500">*</span>
            </Label>
            <PermissionSelector value={permissions} onChange={setPermissions} />
          </div>
        </div>
        
        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              permissions.length === 0 ||
              !permissions.includes("BATCH_VIEW")
            }
          >
            {isSubmitting ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
