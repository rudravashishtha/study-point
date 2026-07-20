"use client";

import { useState, useTransition, type FormEvent } from "react";
import type { Prisma, StudentIntakeSubmissionStatus } from "@prisma/client";
import { Check, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  convertSubmissionAction,
  rejectSubmissionAction,
  updateSubmissionReviewAction,
} from "@/app/admin/intake-submissions/actions";

type Submission = Prisma.StudentIntakeSubmissionGetPayload<{
  include: {
    intakeLink: true;
    academicSession: true;
    curriculumTrack: { include: { board: true; subject: true; programme: true } };
    batch: true;
    convertedStudent: true;
  };
}>;

function statusVariant(status: StudentIntakeSubmissionStatus) {
  if (status === "CONVERTED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function trackLabel(submission: Submission) {
  if (!submission.curriculumTrack) return "Class to confirm";
  return (
    submission.curriculumTrack.displayName ||
    `Class ${submission.curriculumTrack.classLevel}`
  );
}

export function IntakeSubmissionQueue({ submissions }: { submissions: Submission[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  function notesFor(submission: Submission) {
    return notesById[submission.id] ?? submission.adminNotes ?? "";
  }

  function mark(
    event: FormEvent,
    submission: Submission,
    status: "CONTACTED" | "REVIEWED",
  ) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateSubmissionReviewAction({
        id: submission.id,
        status,
        adminNotes: notesFor(submission) || null,
      });
      if (!result.success) {
        toast.error("Could not update submission", { description: result.error });
        return;
      }
      toast.success("Submission updated");
      router.refresh();
    });
  }

  function reject(submission: Submission) {
    startTransition(async () => {
      const result = await rejectSubmissionAction({
        id: submission.id,
        adminNotes: notesFor(submission) || null,
      });
      if (!result.success) {
        toast.error("Could not reject submission", { description: result.error });
        return;
      }
      toast.success("Submission rejected");
      router.refresh();
    });
  }

  function convert(id: string) {
    startTransition(async () => {
      const result = await convertSubmissionAction({ id, createEnrolment: true });
      if (!result.success) {
        toast.error("Could not convert submission", { description: result.error });
        return;
      }
      toast.success("Student created");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {submissions.map((submission) => {
        const locked = submission.status === "CONVERTED" || submission.status === "REJECTED";
        return (
          <article key={submission.id} className="rounded-md border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{submission.studentName}</h3>
                  <Badge variant={statusVariant(submission.status)}>
                    {submission.status}
                  </Badge>
                </div>
                <div className="grid gap-x-6 gap-y-1 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>Student phone: {submission.phone || "Not provided"}</p>
                  <p>Guardian: {submission.guardianName || "Not provided"}</p>
                  <p>Guardian phone: {submission.guardianPhone || "Not provided"}</p>
                  <p>Email: {submission.email || "Not provided"}</p>
                  <p>School: {submission.school || "Not provided"}</p>
                  <p>Submitted: {submission.submittedAt.toLocaleString()}</p>
                  <p>Session: {submission.academicSession.name}</p>
                  <p>Class: {trackLabel(submission)}</p>
                  <p>Batch: {submission.batch?.name ?? "Not locked"}</p>
                  <p>Link: {submission.intakeLink.label}</p>
                </div>
                {submission.address && (
                  <p className="text-sm text-muted-foreground">Address: {submission.address}</p>
                )}
                {submission.message && (
                  <p className="text-sm text-muted-foreground">Message: {submission.message}</p>
                )}
                {submission.convertedStudent && (
                  <p className="text-sm font-medium">
                    Converted to {submission.convertedStudent.studentCode}
                  </p>
                )}
              </div>
            </div>

            <form className="mt-4 space-y-3">
              <div className="space-y-2">
                <label htmlFor={`notes-${submission.id}`} className="text-sm font-medium">
                  Admin notes
                </label>
                <Textarea
                  id={`notes-${submission.id}`}
                  value={notesFor(submission)}
                  disabled={locked}
                  rows={3}
                  onChange={(event) =>
                    setNotesById((current) => ({
                      ...current,
                      [submission.id]: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isPending || locked}
                  onClick={(event) => mark(event, submission, "CONTACTED")}
                >
                  <Check className="mr-2 size-4" />
                  Mark contacted
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isPending || locked}
                  onClick={(event) => mark(event, submission, "REVIEWED")}
                >
                  <Check className="mr-2 size-4" />
                  Mark reviewed
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isPending || locked}
                  onClick={() => convert(submission.id)}
                >
                  <UserPlus className="mr-2 size-4" />
                  Convert
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isPending || locked}
                  onClick={() => reject(submission)}
                >
                  <X className="mr-2 size-4" />
                  Reject
                </Button>
              </div>
            </form>
          </article>
        );
      })}
    </div>
  );
}
