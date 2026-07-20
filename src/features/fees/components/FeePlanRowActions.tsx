"use client";

import React, { useTransition } from "react";
import { FeePlan } from "@prisma/client";
import { toast } from "sonner";
import {
  archiveFeePlanAction,
  restoreFeePlanAction,
  duplicateFeePlanAction,
} from "@/app/admin/fees/actions";
import { useRouter } from "next/navigation";

export function FeePlanRowActions({
  plan,
  onEdit,
}: {
  plan: FeePlan;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(plan.id);
      if (!res.success) {
        toast.error("Error", { description: res.error });
      } else {
        toast.success("Success", { description: successMessage });
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center space-x-2">
      {!plan.archivedAt && (
        <button
          onClick={onEdit}
          disabled={isPending}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          Edit
        </button>
      )}

      {!plan.archivedAt && (
        <button
          onClick={() => handleAction(duplicateFeePlanAction, "Fee plan duplicated")}
          disabled={isPending}
          className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
        >
          Duplicate
        </button>
      )}

      {!plan.archivedAt && (
        <button
          onClick={() => handleAction(archiveFeePlanAction, "Fee plan archived")}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {plan.archivedAt && (
        <button
          onClick={() => handleAction(restoreFeePlanAction, "Fee plan restored")}
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
