"use client";

import { useState } from "react";
import { Teacher, PermissionCapability } from "@prisma/client";
import { assignTeacherAction } from "../../actions/batch-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PermissionSelector } from "./PermissionSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AssignTeacherDialogProps {
  batchId: string;
  availableTeachers: Teacher[];
  trigger?: React.ReactNode;
}

export function AssignTeacherDialog({
  batchId,
  availableTeachers,
  trigger,
}: AssignTeacherDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [permissions, setPermissions] = useState<PermissionCapability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedTeacherId) {
      toast.error("Validation Error", {
        description: "Please select a teacher.",
      });
      return;
    }

    if (permissions.length === 0 || !permissions.includes("BATCH_VIEW")) {
      toast.error("Validation Error", {
        description: "You must explicitly select at least BATCH_VIEW.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await assignTeacherAction(batchId, selectedTeacherId, permissions);

      if (result.error) {
        toast.error("Error", { description: result.error });
      } else {
        toast.success("Success", { description: "Teacher assigned successfully." });
        setOpen(false);
        setSelectedTeacherId("");
        setPermissions([]);
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
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as React.ReactElement} />}
      <DialogContent className="sm:max-w-2xl p-0 flex flex-col overflow-hidden max-h-[90vh]">
        <DialogHeader className="px-4 pt-4 pb-2 sm:px-6 sm:pt-6">
          <DialogTitle>Assign Teacher to Batch</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>
                Select Teacher <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedTeacherId}
                onValueChange={(val) => setSelectedTeacherId(val || "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a teacher..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No available teachers found
                    </SelectItem>
                  ) : (
                    availableTeachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.displayName} {teacher.email ? `(${teacher.email})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Capabilities <span className="text-red-500">*</span>
              </Label>
              <PermissionSelector value={permissions} onChange={setPermissions} />
            </div>
          </div>
        </div>
        
        <div className="m-0 p-4 sm:p-6 border-t bg-muted/40 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !selectedTeacherId ||
              permissions.length === 0 ||
              !permissions.includes("BATCH_VIEW")
            }
          >
            {isSubmitting ? "Assigning..." : "Assign Teacher"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
