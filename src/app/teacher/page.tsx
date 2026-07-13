import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";

export const metadata: Metadata = {
  title: "Teacher Portal | Study Point Mathematics",
};

export default async function TeacherPage() {
  await requireRole(Role.TEACHER);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Teacher Portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The teacher portal is coming soon. Authentication is ready.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
