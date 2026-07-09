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
    } catch (e: any) {
      toast.error("Error", {
        description: e.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger render={trigger as any} />}
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Teacher to Batch</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          <div className="flex justify-end pt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
