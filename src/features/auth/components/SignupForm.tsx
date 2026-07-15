"use client";

import { useActionState, useState } from "react";
import { signUpAdmin } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Eye, EyeOff } from "lucide-react";

type FormState = { error: string | null };

const initialState: FormState = { error: null };

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring";

export function SignupForm() {
  const [state, formAction] = useActionState<FormState, FormData>(signUpAdmin, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full Name
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          placeholder="Jane Doe"
          className={inputClass}
        />
      </div>
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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Enter your password"
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            placeholder="Confirm your password"
            className={`${inputClass} pr-10`}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="registrationKey" className="text-sm font-medium">
          Admin Registration Key
        </label>
        <input
          id="registrationKey"
          name="registrationKey"
          type="password"
          required
          placeholder="Enter registration key"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">
          This key is provided by your institute administrator.
        </p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <SubmitButton type="submit" className="w-full" loadingText="Creating account…">
        Create Account
      </SubmitButton>
    </form>
  );
}
