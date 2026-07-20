import { AlertCircle } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { resolveIntakeLinkByToken } from "@/server/services/student-intake";
import { getSiteSettings } from "@/server/services/site-settings";
import { PublicIntakeForm } from "@/features/student-intake/components/PublicIntakeForm";

type ResolvedIntakeLink = Prisma.StudentIntakeLinkGetPayload<{
  include: {
    academicSession: true;
    curriculumTrack: { include: { board: true; subject: true; programme: true } };
    batch: true;
  };
}>;

function trackLabel(link: ResolvedIntakeLink) {
  if (!link.curriculumTrack) return "Class to be confirmed";
  return link.curriculumTrack.displayName || `Class ${link.curriculumTrack.classLevel}`;
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [linkResult, settingsResult] = await Promise.all([
    resolveIntakeLinkByToken(token),
    getSiteSettings(),
  ]);
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point";

  if (!linkResult.success) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <div className="rounded-md border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto size-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold">Link unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">{linkResult.error.message}</p>
        </div>
      </main>
    );
  }

  const link = linkResult.data;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 py-6 sm:py-10">
      <header className="mb-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{instituteName}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Student information form
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit these details for admin review. This does not create a student
            login account.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{link.academicSession.name}</Badge>
          <Badge variant="secondary">{trackLabel(link)}</Badge>
          {link.batch && <Badge variant="secondary">{link.batch.name}</Badge>}
        </div>
      </header>

      <PublicIntakeForm token={token} />
    </main>
  );
}
