import { format, isValid } from "date-fns";

/**
 * Standardizes date formatting across the application.
 * Replaces ad-hoc `format(new Date(val), "PP")` calls.
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (!isValid(d)) return "Invalid Date";
  return format(d, "PP"); // e.g., Apr 29, 2026
}

export function formatDateTime(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (!isValid(d)) return "Invalid Date";
  return format(d, "PPp"); // e.g., Apr 29, 2026, 9:00 AM
}

/**
 * Standardizes currency formatting (INR).
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
