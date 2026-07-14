import { requireAdmin } from "@/lib/auth/permissions";
import dynamicImport from "next/dynamic";

const QuestionImportWizard = dynamicImport(
  () =>
    import("@/features/imports/components/QuestionImportWizard").then(
      (m) => m.QuestionImportWizard,
    ),
  { loading: () => <div className="h-96 animate-pulse rounded-md bg-muted" /> },
);

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
