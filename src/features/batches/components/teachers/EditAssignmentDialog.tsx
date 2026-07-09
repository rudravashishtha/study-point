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
    } catch (e: any) {
      toast.error("Error", {
        description: e.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions for {assignment.teacher.displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>
              Capabilities <span className="text-red-500">*</span>
            </Label>
            <PermissionSelector value={permissions} onChange={setPermissions} />
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
