import { StudentNavigation } from "./student-navigation";
import { siteConfig } from "@/config/site";

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased pb-24 sm:pb-0">
      <header className="border-b border-border/40 bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-glow/80 mb-0.5">
              {siteConfig.name} Portal
            </p>
            <h1 className="text-lg font-bold font-heading">Command Centre</h1>
          </div>
          <div className="hidden sm:block">
            <StudentNavigation />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Mobile navigation */}
      <div className="sm:hidden block">
        <StudentNavigation />
      </div>
    </div>
  );
}
