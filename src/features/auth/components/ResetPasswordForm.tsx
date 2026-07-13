"use client";

import { useActionState, useState } from "react";
import { updatePassword } from "@/features/auth/actions";
import { LoginButton } from "./LoginButton";
import { PasswordStrength } from "./PasswordStrength";

type FormState = { error: string | null };
const initialState: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    updatePassword,
    initialState,
  );
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="text-xs text-muted-foreground underline hover:text-foreground"
        >
          {show ? "Hide" : "Show"}
        </button>
        <PasswordStrength password={password} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <LoginButton label="Set password" />
    </form>
  );
}
