import type { Metadata } from "next";
import { AuthScreen, type AuthTheme } from "@/features/auth/components/AuthScreen";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | Study Point",
};

const VALID_THEMES: AuthTheme[] = ["student", "teacher", "admin"];

export default async function ThemedLoginPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  const theme = (
    VALID_THEMES.includes(role as AuthTheme) ? role : "student"
  ) as AuthTheme;
  return (
    <AuthScreen theme={theme}>
      <LoginForm />
    </AuthScreen>
  );
}
