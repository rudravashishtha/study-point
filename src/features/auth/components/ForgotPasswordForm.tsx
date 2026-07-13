"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/features/auth/actions";
import { LoginButton } from "./LoginButton";

type FormState = { error: string | null; sent?: boolean };
const initialState: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    requestPasswordReset,
    initialState,
  );

  if (state.sent) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>If an account exists for that email, a reset link is on its way.</p>
        <p>Check your inbox and follow the link to choose a new password.</p>
        <Link href="/login" className="block font-medium text-primary underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <LoginButton label="Send reset link" />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
