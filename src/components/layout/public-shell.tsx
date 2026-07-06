import Link from "next/link";
import { BookOpen, GraduationCap, MapPin, Megaphone } from "lucide-react";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/announcements", label: "Announcements" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold">
                  1plus1 Mathematics
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  CBSE and CISCE, Classes IX-XII
                </span>
              </span>
            </Link>
            <Link
              href="/contact"
              className="hidden h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
            >
              <MapPin className="size-4" aria-hidden="true" />
              Contact
            </Link>
          </div>
          <nav aria-label="Public navigation" className="flex gap-2 overflow-x-auto pb-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-3 sm:px-6 lg:px-8">
          <p>Mathematics coaching for CBSE, ICSE, and ISC learners.</p>
          <p className="flex items-center gap-2">
            <BookOpen className="size-4" aria-hidden="true" />
            Structured content, careful practice, and timely review.
          </p>
          <p className="flex items-center gap-2">
            <Megaphone className="size-4" aria-hidden="true" />
            Public notices and resources stay easy to find.
          </p>
        </div>
      </footer>
    </div>
  );
}
