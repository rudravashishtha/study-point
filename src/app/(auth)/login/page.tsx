import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Study Point Mathematics",
};

export default function LoginPage() {
  return (
    <AuthScreen theme="default">
      <LoginForm />
    </AuthScreen>
  );
}
