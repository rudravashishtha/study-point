import { StudentNavigation } from "./student-navigation";
import { siteConfig } from "@/config/site";
import { LogOut } from "lucide-react";
import { signOut } from "@/features/auth/actions";

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased pb-24 sm:pb-0">
      <header className="border-b border-border/40 bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {siteConfig.name} Portal
            </p>
            <h1 className="text-lg font-bold font-heading">Command Centre</h1>
          </div>
          <div className="flex items-center gap-3">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-surface"
              >
                <LogOut className="size-4 opacity-70" />
                <span>Log out</span>
              </button>
            </form>
            <div className="hidden sm:block">
              <StudentNavigation />
            </div>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
      >
        {children}
      </main>

      {/* Mobile navigation */}
      <div className="sm:hidden block">
        <StudentNavigation />
      </div>
    </div>
  );
}
