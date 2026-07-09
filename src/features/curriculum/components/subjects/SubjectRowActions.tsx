"use client";

import React, { useTransition } from "react";
import { Subject } from "@prisma/client";
import { toast } from "sonner";
import { archiveSubjectAction, restoreSubjectAction } from "../../actions/subjects";
import { useRouter } from "next/navigation";

export function SubjectRowActions({
  subject,
  onEdit,
}: {
  subject: Subject;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(subject.id);
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
        disabled={isPending || !!subject.archivedAt}
        className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
      >
        Edit
      </button>

      {!subject.archivedAt && (
        <button
          onClick={() => handleAction(archiveSubjectAction, "Subject archived")}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {subject.archivedAt && (
        <button
          onClick={() => handleAction(restoreSubjectAction, "Subject restored")}
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
