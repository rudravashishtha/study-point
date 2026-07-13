"use client";

import type { ReactNode } from "react";

export function buildWhatsAppHref(phoneNumber?: string | null, message?: string): string {
  const digits = (phoneNumber ?? "").replace(/\D/g, "");
  if (!digits) return "#";
  const base = `https://wa.me/${digits}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export interface AdmissionsEnquiryInput {
  instituteName: string;
  name?: string;
  phone?: string;
  classLevel?: string;
  board?: string;
  message?: string;
}

export function buildAdmissionsEnquiryMessage(input: AdmissionsEnquiryInput): string {
  const lines = [
    `Hello ${input.instituteName}, I would like to enquire about admissions.`,
  ];
  const name = input.name?.trim();
  const phone = input.phone?.trim();
  const classLevel = input.classLevel?.trim();
  const board = input.board?.trim();
  const message = input.message?.trim();
  if (name) lines.push(`Name: ${name}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (classLevel) lines.push(`Class: ${classLevel}`);
  if (board) lines.push(`Board: ${board}`);
  if (message) lines.push(message);
  return lines.join("\n");
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
