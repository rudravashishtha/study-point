import { requireAdmin } from "@/lib/auth/permissions";
import { listStudentActivationCandidates } from "@/server/services/provisioning";
import { StudentActivationQueue } from "@/features/students/components/StudentActivationQueue";

export default async function StudentActivationPage() {
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

  const candidates = await listStudentActivationCandidates(actor);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Activation</h1>
        <p className="text-muted-foreground mt-1">
          Review and invite unprovisioned students. Students with missing emails cannot be
          invited.
        </p>
      </div>

      <StudentActivationQueue candidates={candidates} />
    </div>
  );
}
