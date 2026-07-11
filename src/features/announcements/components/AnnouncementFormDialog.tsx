"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import { Prisma, AnnouncementAudience, AnnouncementPriority } from "@prisma/client";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/admin/announcements/actions";
import { useRouter } from "next/navigation";

type AnnouncementRow = Prisma.AnnouncementGetPayload<{
  include: {
    academicSession: { select: { id: true; name: true } };
    curriculumTrack: { select: { id: true; displayName: true } };
    batch: { select: { id: true; name: true } };
  };
}>;

export function AnnouncementFormDialog({
  announcement,
  sessions,
  tracks,
  batches,
  open,
  onOpenChange,
}: {
  announcement?: AnnouncementRow;
  sessions: { id: string; name: string }[];
  tracks: { id: string; displayName: string; archivedAt: Date | null }[];
  batches: {
    id: string;
    name: string;
    archivedAt: Date | null;
    academicSessionId: string;
    curriculumTrackId: string;
  }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [audience, setAudience] = useState<AnnouncementAudience>(
    announcement?.audience || "PUBLIC",
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {
      academicSessionId: (formData.get("academicSessionId") as string) || null,
      audience: audience,
      curriculumTrackId:
        audience === "CURRICULUM_TRACK"
          ? (formData.get("curriculumTrackId") as string)
          : audience === "BATCH"
            ? null
            : null,
      batchId: audience === "BATCH" ? (formData.get("batchId") as string) : null,
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      priority: (formData.get("priority") as AnnouncementPriority) || "NORMAL",
      publish: formData.get("publish") === "on",
      expiresAt: (formData.get("expiresAt") as string) || null,
    };

    startTransition(async () => {
      const res = announcement
        ? await updateAnnouncementAction(announcement.id, payload)
        : await createAnnouncementAction(payload);

      if (!res.success) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(
          announcement ? "Notice updated successfully" : "Notice created successfully",
        );
        onOpenChange(false);
        router.refresh();
      }
    });
  };

  if (!open) return null;

  const audienceOptions: { value: AnnouncementAudience; label: string }[] = [
    { value: "PUBLIC", label: "Public" },
    { value: "ALL_STUDENTS", label: "All Students" },
    { value: "CURRICULUM_TRACK", label: "Specific Track" },
    { value: "BATCH", label: "Specific Batch" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-md border bg-background p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-semibold">
          {announcement ? "Edit Notice" : "Create Notice"}
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <input
              id="title"
              name="title"
              required
              defaultValue={announcement?.title}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Holiday on Friday"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content *
            </label>
            <textarea
              id="content"
              name="content"
              required
              rows={4}
              defaultValue={announcement?.content}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Write the notice content here..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="audience" className="text-sm font-medium">
                Audience *
              </label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value as AnnouncementAudience)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {audienceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="priority" className="text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={announcement?.priority || "NORMAL"}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {audience === "CURRICULUM_TRACK" && (
            <div className="space-y-2">
              <label htmlFor="curriculumTrackId" className="text-sm font-medium">
                Curriculum Track *
              </label>
              <select
                id="curriculumTrackId"
                name="curriculumTrackId"
                required
                defaultValue={announcement?.curriculumTrackId || ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select track</option>
                {tracks
                  .filter((t) => !t.archivedAt)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayName}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {audience === "BATCH" && (
            <div className="space-y-2">
              <label htmlFor="batchId" className="text-sm font-medium">
                Batch *
              </label>
              <select
                id="batchId"
                name="batchId"
                required
                defaultValue={announcement?.batchId || ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select batch</option>
                {batches
                  .filter((b) => !b.archivedAt)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="academicSessionId" className="text-sm font-medium">
                Academic Session
              </label>
              <select
                id="academicSessionId"
                name="academicSessionId"
                defaultValue={announcement?.academicSessionId || ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">None</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="expiresAt" className="text-sm font-medium">
                Expires At (optional)
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="date"
                defaultValue={
                  announcement?.expiresAt
                    ? new Date(announcement.expiresAt).toISOString().split("T")[0]
                    : ""
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {!announcement && (
            <label className="flex items-center space-x-2 text-sm font-medium">
              <input
                type="checkbox"
                name="publish"
                className="h-4 w-4 rounded border-input"
              />
              <span>Publish immediately</span>
            </label>
          )}

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isPending ? "Saving..." : announcement ? "Save Changes" : "Create Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
