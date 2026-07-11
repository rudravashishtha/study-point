import { requireAdmin } from "@/lib/auth/permissions";
import { QuestionImportWizard } from "@/features/imports/components/QuestionImportWizard";

export const dynamic = "force-dynamic";

export default async function QuestionImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Questions</h1>
        <p className="text-muted-foreground mt-1">
          Download the template, fill in question data, upload, validate, and confirm.
        </p>
      </div>

      <QuestionImportWizard />
    </div>
  );
}
