import { requireAdmin } from "@/lib/auth/permissions";
import { listTeacherActivationCandidates } from "@/server/services/provisioning";
import { TeacherActivationQueue } from "@/features/teachers/components/TeacherActivationQueue";

export default async function TeacherActivationPage() {
  const appUser = await requireAdmin();
  const actor = {
    userId: appUser.id,
    role: appUser.role,
    metadata: {
      role: appUser.role,
      status: appUser.status,
      email: appUser.email || undefined,
    },
  };

  const candidates = await listTeacherActivationCandidates(actor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teacher Activation</h1>
        <p className="text-muted-foreground mt-1">
          Review and invite unprovisioned teachers. Teachers with missing emails cannot be
          invited.
        </p>
      </div>

      <TeacherActivationQueue candidates={candidates} />
    </div>
  );
}
