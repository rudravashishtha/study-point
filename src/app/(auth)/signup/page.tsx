import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { serverEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Administrator Setup | Study Point Mathematics",
};

export default function SignupPage() {
  if (!serverEnv.ENABLE_ADMIN_SIGNUP) {
    notFound();
  }

  return (
    <AuthScreen theme="admin-signup">
      <SignupForm />
    </AuthScreen>
  );
}
