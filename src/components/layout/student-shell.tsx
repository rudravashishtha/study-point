import { StudentNavigation } from "./student-navigation";
import { LogOut, User } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { getSiteSettings } from "@/server/services/site-settings";
import { ClassLevel } from "@prisma/client";

type EnrolmentInfo = {
  id: string;
  batch: { id: string; name: string } | null;
  curriculumTrack: {
    classLevel: ClassLevel;
    subject: { name: string };
  };
  academicSession: { name: string };
};

export async function StudentShell({
  children,
  studentName,
  studentCode,
  enrolments,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  studentName: string | null;
  studentCode: string | null;
  enrolments: EnrolmentInfo[];
  unreadCount?: number;
}) {
  const settingsResult = await getSiteSettings();
  const instituteName = settingsResult.success
    ? settingsResult.data.instituteName
    : "Study Point";

  const enrolmentLabel =
    enrolments.length > 0
      ? `${enrolments[0].curriculumTrack.classLevel} · ${enrolments[0].batch?.name ?? enrolments[0].curriculumTrack.subject.name} · ${enrolments[0].academicSession.name}`
      : null;

  const initials = studentName
    ? studentName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  return (
    <div className="min-h-dvh bg-surface text-foreground font-sans antialiased pb-24 sm:pb-0">
      <header className="border-b border-border/40 bg-surface-elevated/80 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {initials ? (
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                {initials}
              </div>
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                <User className="size-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <p className="text-xs font-medium text-primary truncate max-w-[180px] sm:max-w-xs">
                {studentName ?? instituteName}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {studentCode ?? instituteName}
              </p>
              {enrolmentLabel && (
                <p className="text-[10px] text-muted-foreground/70 truncate max-w-[200px] sm:max-w-sm">
                  {enrolmentLabel}
                </p>
              )}
            </div>
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
              <StudentNavigation unreadCount={unreadCount} />
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
        <StudentNavigation unreadCount={unreadCount} />
      </div>
    </div>
  );
}

export type { EnrolmentInfo };
