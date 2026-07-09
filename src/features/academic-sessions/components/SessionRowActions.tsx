"use client";

import React, { useTransition } from "react";
import { AcademicSession } from "@prisma/client";
import { toast } from "sonner";
import {
  activateSessionAction,
  archiveSessionAction,
  restoreSessionAction,
} from "@/app/admin/academic-sessions/actions";
import { useRouter } from "next/navigation";

export function SessionRowActions({
  session,
  onEdit,
}: {
  session: AcademicSession;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(session.id);
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
      <button
        onClick={onEdit}
        disabled={isPending}
        className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
      >
        Edit
      </button>

      {!session.isActive && !session.archivedAt && (
        <button
          onClick={() =>
            handleAction(activateSessionAction, "Session activated successfully")
          }
          disabled={isPending}
          className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
        >
          Set Active
        </button>
      )}

      {!session.archivedAt && !session.isActive && (
        <button
          onClick={() => handleAction(archiveSessionAction, "Session archived")}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {session.archivedAt && (
        <button
          onClick={() => handleAction(restoreSessionAction, "Session restored")}
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
