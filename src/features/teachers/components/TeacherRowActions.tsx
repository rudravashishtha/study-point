"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Loader2, Power, PowerOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TeacherFormDialog } from "./TeacherFormDialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import type { Subject } from "@prisma/client";
import { TeacherWithAppUser } from "./TeacherList";
import { getTeacherInvitationEligibility } from "../domain/provisioning";
import type { AppUserStatus } from "../domain/provisioning";

interface TeacherRowActionsProps {
  teacher: TeacherWithAppUser;
  availableSubjects: Subject[];
  onActionComplete?: () => void;
}

export function TeacherRowActions({ teacher, availableSubjects, onActionComplete }: TeacherRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const router = useRouter();
  const isProcessing = processingAction !== null;

  const handleToggleStatus = async () => {
    setProcessingAction("toggle");
    try {
      let result;
      if (teacher.active) {
        const { archiveTeacherAction } = await import("@/app/admin/teachers/actions");
        result = await archiveTeacherAction(teacher.id);
      } else {
        const { restoreTeacherAction } = await import("@/app/admin/teachers/actions");
        result = await restoreTeacherAction(teacher.id);
      }

      if (!result.success) {
        toast.error("Action Failed", {
          description: result.error,
        });
      } else {
        toast.success("Success", {
          description: `Teacher ${teacher.active ? "deactivated" : "reactivated"} successfully.`,
        });
        router.refresh();
        onActionComplete?.();
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setProcessingAction(null);
      setConfirmToggleOpen(false);
    }
  };

  const handleInvite = async () => {
    setProcessingAction("invite");
    try {
      const { inviteTeacherAction } = await import("@/app/admin/teachers/actions");
      const result = await inviteTeacherAction(teacher.id);

      if (!result.success) {
        toast.error("Action Failed", {
          description: "error" in result ? result.error : "Unknown error",
        });
      } else {
        toast.success("Success", {
          description: "Teacher invited successfully.",
        });
        router.refresh();
        onActionComplete?.();
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReset = async () => {
    setProcessingAction("reset");
    try {
      const { resetTeacherInvitationAction } =
        await import("@/app/admin/teachers/activate/actions");
      const result = await resetTeacherInvitationAction(teacher.id);

      if (!result.success) {
        toast.error("Reset Failed", {
          description: "error" in result ? result.error : "Unknown error",
        });
      } else {
        toast.success("Success", { description: "Invitation reset. You can now re-invite this teacher." });
        router.refresh();
        onActionComplete?.();
      }
    } catch (error: unknown) {
      toast.error("Reset Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setProcessingAction(null);
    }
  };

  const eligibility = getTeacherInvitationEligibility({
    active: teacher.active,
    email: teacher.email,
    appUserStatus: teacher.appUser?.status as AppUserStatus | null,
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="h-8 w-8 p-0" disabled={isProcessing} />
          }
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />

          {eligibility.canInvite && (
            <DropdownMenuItem onClick={handleInvite} disabled={isProcessing}>
              {processingAction === "invite" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              Invite Teacher
            </DropdownMenuItem>
          )}

          {eligibility.canReset && (
            <DropdownMenuItem onClick={handleReset} disabled={isProcessing}>
              {processingAction === "reset" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Reset Invitation
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setConfirmToggleOpen(true)}
            disabled={isProcessing}
            className={
              teacher.active
                ? "text-red-600 focus:text-red-600"
                : "text-green-600 focus:text-green-600"
            }
          >
            {processingAction === "toggle" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : teacher.active ? (
              <PowerOff className="mr-2 h-4 w-4" />
            ) : (
              <Power className="mr-2 h-4 w-4" />
            )}
            {teacher.active ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmToggleOpen}
        onOpenChange={setConfirmToggleOpen}
        title={teacher.active ? "Deactivate teacher?" : "Reactivate teacher?"}
        description={`Are you sure you want to ${teacher.active ? "deactivate" : "reactivate"} ${teacher.displayName}?`}
        confirmLabel={teacher.active ? "Deactivate" : "Reactivate"}
        onConfirm={handleToggleStatus}
      />

      <TeacherFormDialog
        mode="edit"
        teacher={teacher}
        availableSubjects={availableSubjects}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onActionComplete}
      />
    </>
  );
}
