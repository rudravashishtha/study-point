import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password | Study Point",
};

export default function ForgotPasswordPage() {
  return (
    <AuthScreen theme="forgot">
      <ForgotPasswordForm />
    </AuthScreen>
  );
}
