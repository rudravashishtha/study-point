import { requireAdmin } from "@/lib/auth/permissions";
import dynamicImport from "next/dynamic";

const StudentImportWizard = dynamicImport(
  () =>
    import("@/features/imports/components/StudentImportWizard").then(
      (m) => m.StudentImportWizard,
    ),
  { loading: () => <div className="h-96 animate-pulse rounded-md bg-muted" /> },
);

export default async function StudentImportPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Students</h1>
        <p className="text-muted-foreground mt-1">
          Download the template, fill in student data, upload, validate, and confirm.
        </p>
      </div>

      <StudentImportWizard />
    </div>
  );
}
