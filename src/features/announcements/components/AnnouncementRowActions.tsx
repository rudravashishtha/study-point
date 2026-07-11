"use client";

import React, { useTransition } from "react";
import { Announcement } from "@prisma/client";
import { toast } from "sonner";
import {
  publishAnnouncementAction,
  archiveAnnouncementAction,
  restoreAnnouncementAction,
} from "@/app/admin/announcements/actions";
import { useRouter } from "next/navigation";

export function AnnouncementRowActions({
  announcement,
  onEdit,
}: {
  announcement: Announcement;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleAction = (
    actionFn: (id: string) => Promise<{ success: boolean; error?: string }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const res = await actionFn(announcement.id);
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
      {!announcement.archivedAt && (
        <button
          onClick={onEdit}
          disabled={isPending}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
        >
          Edit
        </button>
      )}

      {!announcement.archivedAt && !announcement.publishedAt && (
        <button
          onClick={() => handleAction(publishAnnouncementAction, "Notice published")}
          disabled={isPending}
          className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
        >
          Publish
        </button>
      )}

      {!announcement.archivedAt && (
        <button
          onClick={() => handleAction(archiveAnnouncementAction, "Notice archived")}
          disabled={isPending}
          className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          Archive
        </button>
      )}

      {announcement.archivedAt && (
        <button
          onClick={() => handleAction(restoreAnnouncementAction, "Notice restored")}
          disabled={isPending}
          className="text-sm font-medium text-orange-600 hover:underline disabled:opacity-50"
        >
          Restore
        </button>
      )}
    </div>
  );
}
