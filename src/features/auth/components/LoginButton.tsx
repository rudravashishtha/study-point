"use client";

import { SubmitButton } from "@/components/ui/submit-button";

export function LoginButton({ label = "Sign in" }: { label?: string }) {
  return (
    <SubmitButton type="submit" className="w-full" loadingText="Please wait…">
      {label}
    </SubmitButton>
  );
}
