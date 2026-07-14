"use client";

import { signOut } from "@/features/auth/actions";
import { SubmitButton } from "@/components/ui/submit-button";

function LogoutSubmit() {
  return (
    <SubmitButton
      type="submit"
      variant="ghost"
      className="text-muted-foreground"
      loadingText="Logging out…"
    >
      Log out
    </SubmitButton>
  );
}

export function LogoutButton() {
  return (
    <form action={signOut}>
      <LogoutSubmit />
    </form>
  );
}
