import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
      <footer className="py-4 text-center text-xs text-muted-foreground">
        Study Point Mathematics
      </footer>
    </div>
  );
}
