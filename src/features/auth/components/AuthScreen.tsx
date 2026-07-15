import type { ReactNode } from "react";

export type AuthTheme =
  "default" | "student" | "teacher" | "admin" | "admin-signup" | "forgot";

const THEMES: Record<
  AuthTheme,
  { title: string; subtitle: string; card: string; accent: string }
> = {
  default: {
    title: "Welcome back",
    subtitle: "Sign in to your Study Point account",
    card: "border-border bg-card",
    accent: "text-indigo-600",
  },
  forgot: {
    title: "Reset your password",
    subtitle: "Enter your email to receive a reset link",
    card: "border-border bg-card",
    accent: "text-indigo-600",
  },
  student: {
    title: "Welcome, student",
    subtitle: "Continue your mathematics journey",
    card: "border-rose-200 bg-rose-50/60",
    accent: "text-rose-600",
  },
  teacher: {
    title: "Teacher sign in",
    subtitle: "Manage your batches and students",
    card: "border-sky-200 bg-sky-50/60",
    accent: "text-sky-600",
  },
  admin: {
    title: "Administration",
    subtitle: "Institute management console",
    card: "border-emerald-200 bg-emerald-50/60",
    accent: "text-emerald-600",
  },
  "admin-signup": {
    title: "Administrator Setup",
    subtitle: "Create an administration account",
    card: "border-purple-200 bg-purple-50/60",
    accent: "text-purple-600",
  },
};

export function AuthScreen({
  theme,
  children,
}: {
  theme: AuthTheme;
  children: ReactNode;
}) {
  const t = THEMES[theme];
  return (
    <div className={`rounded-2xl border bg-card p-6 shadow-sm sm:p-8 ${t.card}`}>
      <div className="mb-6">
        <p className={`text-sm font-medium ${t.accent}`}>Study Point Mathematics</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.subtitle}</p>
      </div>
      {children}
    </div>
  );
}
