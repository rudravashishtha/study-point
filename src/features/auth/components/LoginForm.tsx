"use client";

import { useActionState } from "react";
import { signIn } from "@/features/auth/actions";
import { LoginButton } from "./LoginButton";

type FormState = { error: string | null };

const initialState: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(signIn, initialState);

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
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <LoginButton />
    </form>
  );
}
