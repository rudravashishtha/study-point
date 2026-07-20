"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { AcademicSession, Batch, ClassLevel, Prisma } from "@prisma/client";
import { Archive, Copy, MessageCircle, PauseCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  archiveIntakeLinkAction,
  createIntakeLinkAction,
  deleteArchivedIntakeLinkAction,
  deactivateIntakeLinkAction,
} from "@/app/admin/intake-links/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Track = {
  id: string;
  classLevel: ClassLevel;
  displayName: string;
  board: { id: string; name: string; code: string; archivedAt: Date | null };
  subject: { id: string; name: string; code: string; archivedAt: Date | null };
  programme: { id: string; name: string; code: string; archivedAt: Date | null } | null;
};

type IntakeLink = Prisma.StudentIntakeLinkGetPayload<{
  include: {
    academicSession: true;
    curriculumTrack: { include: { board: true; subject: true; programme: true } };
    batch: true;
    _count: { select: { submissions: true } };
  };
}>;

function trackLabel(track: Track | null) {
  if (!track) return "Any class";
  return track.displayName || `Class ${track.classLevel}`;
}

function linkStatus(link: IntakeLink) {
  if (link.archivedAt) return "Archived";
  if (!link.isActive) return "Inactive";
  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) return "Expired";
  if (link.maxSubmissions && link.submissionCount >= link.maxSubmissions) {
    return "Closed";
  }
  return "Active";
}

export function IntakeLinkManagement({
  links,
  sessions,
  tracks,
  batches,
}: {
  links: IntakeLink[];
  sessions: AcademicSession[];
  tracks: Track[];
  batches: Batch[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IntakeLink | null>(null);

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    toast.success("Copied");
  }

  function createLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      label: formData.get("label"),
      academicSessionId: formData.get("academicSessionId"),
      curriculumTrackId: formData.get("curriculumTrackId") || null,
      batchId: formData.get("batchId") || null,
      expiresAt: formData.get("expiresAt")
        ? new Date(String(formData.get("expiresAt")))
        : null,
      maxSubmissions: formData.get("maxSubmissions") || null,
    };

    startTransition(async () => {
      const result = await createIntakeLinkAction(payload);
      if (!result.success) {
        toast.error("Could not create link", { description: result.error });
        return;
      }
      setCreatedUrl(result.data.url);
      form.reset();
      toast.success("Private link created");
      router.refresh();
    });
  }

  function deactivate(id: string) {
    startTransition(async () => {
      const result = await deactivateIntakeLinkAction(id);
      if (!result.success) {
        toast.error("Could not deactivate link", { description: result.error });
        return;
      }
      toast.success("Link deactivated");
      router.refresh();
    });
  }

  function archive(id: string) {
    startTransition(async () => {
      const result = await archiveIntakeLinkAction(id);
      if (!result.success) {
        toast.error("Could not archive link", { description: result.error });
        return;
      }
      toast.success("Link archived");
      router.refresh();
    });
  }

  function deleteArchived() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteArchivedIntakeLinkAction(deleteTarget.id);
      if (!result.success) {
        toast.error("Could not delete link", { description: result.error });
        return;
      }
      toast.success("Archived link deleted");
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createLink} className="rounded-md border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="size-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-base font-semibold">Create private link</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="label" className="text-sm font-medium">
              Label
            </label>
            <Input id="label" name="label" required placeholder="e.g. Class X new enquiries" />
          </div>
          <div className="space-y-2">
            <label htmlFor="academicSessionId" className="text-sm font-medium">
              Academic session
            </label>
            <select id="academicSessionId" name="academicSessionId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Select session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="curriculumTrackId" className="text-sm font-medium">
              Class
            </label>
            <select id="curriculumTrackId" name="curriculumTrackId" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">Any class</option>
              {tracks.map((track) => (
                <option key={track.id} value={track.id}>
                  {trackLabel(track)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="batchId" className="text-sm font-medium">
              Batch
            </label>
            <select id="batchId" name="batchId" className="h-10 w-full rounded-md border bg-background px-3 text-sm">
              <option value="">No batch lock</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="expiresAt" className="text-sm font-medium">
                Expiry
              </label>
              <Input id="expiresAt" name="expiresAt" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxSubmissions" className="text-sm font-medium">
                Max submissions
              </label>
              <Input id="maxSubmissions" name="maxSubmissions" type="number" min="1" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            Create link
          </Button>
        </div>
      </form>

      {createdUrl && (
        <div className="rounded-md border border-emerald-600/30 bg-emerald-50 p-4 text-sm text-emerald-950">
          <p className="font-medium">Copy this URL now. It will not be shown again.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input value={createdUrl} readOnly />
            <Button type="button" variant="outline" onClick={() => copy(createdUrl)}>
              <Copy className="mr-2 size-4" />
              Copy
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Please fill this student information form for Study Point:\n${createdUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              <MessageCircle className="mr-2 size-4" />
              WhatsApp
            </a>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {links.map((link) => (
          <article key={link.id} className="rounded-md border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{link.label}</h3>
                  <Badge variant={linkStatus(link) === "Active" ? "default" : "secondary"}>
                    {linkStatus(link)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {link.academicSession.name} · {trackLabel(link.curriculumTrack)} ·{" "}
                  {link.batch?.name ?? "No batch"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {link.submissionCount} submission{link.submissionCount === 1 ? "" : "s"}
                  {link.maxSubmissions ? ` / ${link.maxSubmissions}` : ""} · Expires{" "}
                  {link.expiresAt ? link.expiresAt.toLocaleString() : "never"}
                </p>
              </div>
              <div className="flex gap-2">
                {link.archivedAt ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setDeleteTarget(link)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || !link.isActive}
                      onClick={() => deactivate(link.id)}
                    >
                      <PauseCircle className="mr-2 size-4" />
                      Deactivate
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => archive(link.id)}
                    >
                      <Archive className="mr-2 size-4" />
                      Archive
                    </Button>
                  </>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete archived link?"
        description={
          deleteTarget
            ? `This permanently deletes "${deleteTarget.label}". Links with submissions cannot be deleted.`
            : "This permanently deletes the archived intake link."
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={isPending}
        onConfirm={deleteArchived}
      />
    </div>
  );
}
