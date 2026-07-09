"use client";

import React, { useTransition } from "react";
import { Programme } from "@prisma/client";
import { toast } from "sonner";
import { archiveProgrammeAction, restoreProgrammeAction } from "../../actions/programmes";
import { useRouter } from "next/navigation";

export function ProgrammeRowActions({
  programme,
  onEdit,
}: {
  programme: Programme;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(programme.id);
      if (!res.success) {
        toast.error(res.error);
      } else {
        toast.success(successMessage);
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center space-x-2 justify-end">
      <button
        onClick={onEdit}
        disabled={isPending || !!programme.archivedAt}
        className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
      >
        Edit
      </button>

      {!programme.archivedAt && (
        <button
          onClick={() => handleAction(archiveProgrammeAction, "Programme archived")}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {programme.archivedAt && (
        <button
          onClick={() => handleAction(restoreProgrammeAction, "Programme restored")}
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
