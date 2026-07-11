"use client";

import React, { useTransition } from "react";
import { FeePlan } from "@prisma/client";
import { toast } from "sonner";
import { archiveFeePlanAction, restoreFeePlanAction } from "@/app/admin/fees/actions";
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
        toast.error(res.error);
      } else {
        toast.success(successMessage);
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
