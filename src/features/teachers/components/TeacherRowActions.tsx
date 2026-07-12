"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Power, PowerOff } from "lucide-react";
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

import { TeacherWithAppUser } from "./TeacherList";
import { getTeacherInvitationEligibility } from "../domain/provisioning";
import type { AppUserStatus } from "../domain/provisioning";

interface TeacherRowActionsProps {
  teacher: TeacherWithAppUser;
  onActionComplete?: () => void;
}

export function TeacherRowActions({ teacher, onActionComplete }: TeacherRowActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const handleToggleStatus = async () => {
    if (
      !confirm(
        `Are you sure you want to ${teacher.active ? "deactivate" : "reactivate"} ${teacher.displayName}?`,
      )
    )
      return;

    setIsProcessing(true);
    try {
      let result;
      if (teacher.active) {
        const { archiveTeacherAction } = await import("@/app/admin/teachers/actions");
        result = await archiveTeacherAction(teacher.id);
      } else {
        const { restoreTeacherAction } = await import("@/app/admin/teachers/actions");
        result = await restoreTeacherAction(teacher.id);
      }

      if (result.error) {
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
      setIsProcessing(false);
    }
  };

  const handleInvite = async () => {
    setIsProcessing(true);
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
      setIsProcessing(false);
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
              <Power className="mr-2 h-4 w-4" />
              Invite Teacher
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleToggleStatus}
            disabled={isProcessing}
            className={
              teacher.active
                ? "text-red-600 focus:text-red-600"
                : "text-green-600 focus:text-green-600"
            }
          >
            {teacher.active ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                Reactivate
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TeacherFormDialog
        mode="edit"
        teacher={teacher}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={onActionComplete}
      />
    </>
  );
}
