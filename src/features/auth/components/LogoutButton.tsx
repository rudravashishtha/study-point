"use client";

import { signOut } from "@/features/auth/actions";
import { useFormStatus } from "react-dom";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {pending ? "Logging out…" : "Log out"}
    </button>
  );
}

export function LogoutButton() {
  return (
    <form action={signOut}>
      <LogoutSubmit />
    </form>
  );
}
