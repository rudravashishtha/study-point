"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inviteStudentAction } from "@/app/admin/students/activate/actions";
import { toast } from "sonner";
import { Power } from "lucide-react";

interface InviteStudentButtonProps {
  studentId: string;
  isEligible: boolean;
}

export function InviteStudentButton({ studentId, isEligible }: InviteStudentButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleInvite = async () => {
    if (!isEligible) return;

    setIsPending(true);
    try {
      const result = await inviteStudentAction(studentId);

      if (!result.success) {
        toast.error("Action Failed", {
          description: result.error,
        });
      } else {
        toast.success("Success", {
          description: "Student invited successfully.",
        });
      }
    } catch (error: unknown) {
      toast.error("Action Failed", {
        description:
          error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleInvite}
      disabled={!isEligible || isPending}
      variant={isEligible ? "default" : "secondary"}
      size="sm"
    >
      <Power className="mr-2 h-4 w-4" />
      {isPending ? "Inviting..." : "Invite Student"}
    </Button>
  );
}
