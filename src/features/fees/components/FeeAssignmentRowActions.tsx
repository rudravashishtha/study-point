"use client";

import React, { useTransition } from "react";
import { toast } from "sonner";
import {
  archiveFeeAssignmentAction,
  restoreFeeAssignmentAction,
} from "@/app/admin/fee-assignments/actions";
import { useRouter } from "next/navigation";

interface RowAssignment {
  id: string;
  archivedAt: Date | null;
}

export function FeeAssignmentRowActions({ assignment }: { assignment: RowAssignment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(assignment.id);
      if (!res.success) {
        toast.error("Error", { description: res.error });
      } else {
        toast.success("Success", { description: successMessage });
        router.refresh();
      }
    });
  };

  if (assignment.archivedAt) {
    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() =>
            handleAction(restoreFeeAssignmentAction, "Fee assignment restored")
          }
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() =>
          handleAction(archiveFeeAssignmentAction, "Fee assignment archived")
        }
        disabled={isPending}
        className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
      >
        Archive
      </button>
    </div>
  );
}
