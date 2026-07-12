"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, MessageSquare } from "lucide-react";
interface PublicHeaderProps {
  settings: {
    instituteName: string;
    phone?: string | null;
    whatsappNumber?: string | null;
    socialLinks?: Record<string, string> | null;
  } | null;
}

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/announcements", label: "Notices" },
  { href: "/contact", label: "Contact" },
  { href: "/admissions", label: "Admissions" },
];

export function PublicHeader({ settings }: PublicHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const phone = settings?.phone ?? null;
  const instituteName = settings?.instituteName ?? "Study Point";

  const phoneHref = phone ? `tel:+${phone.replace(/\D/g, "")}` : "#";
  const phoneLink = phone ? (
    <a
      href={phoneHref}
      className="hidden sm:flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      aria-label={`Call ${phone}`}
    >
      <Phone className="size-4" aria-hidden="true" />
      <span>{phone}</span>
    </a>
  ) : null;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-surface/90 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading font-bold text-xl text-foreground"
          aria-label={`${instituteName} - Home`}
        >
          <span className="text-brand-glow">△</span>
          <span>{instituteName}</span>
        </Link>

        <nav
          className="hidden md:flex md:items-center md:gap-6"
          role="navigation"
          aria-label="Main navigation"
        >
          <ul className="flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          {phoneLink}
          <a
            href={`https://wa.me/${(settings?.whatsappNumber || "").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            aria-label="Contact via WhatsApp"
          >
            <MessageSquare className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <svg
                className="size-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="size-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-border/60 bg-surface animate-slide-down"
        >
          <nav className="px-4 py-4" role="navigation" aria-label="Mobile navigation">
            <ul className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-md px-3 py-2.5 text-base font-medium text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
