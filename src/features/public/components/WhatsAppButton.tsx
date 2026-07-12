import type { ReactNode } from "react";

export function buildWhatsAppHref(phoneNumber?: string | null, message?: string): string {
  const digits = (phoneNumber ?? "").replace(/\D/g, "");
  if (!digits) return "#";
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

interface WhatsAppButtonProps {
  phoneNumber?: string | null;
  message?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}

export function WhatsAppButton({
  phoneNumber,
  message,
  className,
  children,
  ariaLabel = "Contact via WhatsApp",
}: WhatsAppButtonProps) {
  const href = buildWhatsAppHref(phoneNumber, message);
  const disabled = href === "#";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      onClick={disabled ? (event) => event.preventDefault() : undefined}
    >
      {children}
    </a>
  );
}
