import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set your password | Study Point",
  other: { referrer: "no-referrer" },
};

export default function ResetPasswordPage() {
  return (
    <AuthScreen theme="default">
      <ResetPasswordForm />
    </AuthScreen>
  );
}
