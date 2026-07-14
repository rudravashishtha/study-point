import { z } from "zod";

/**
 * Validates a YYYY-MM-DD string, preventing impossible dates (like Feb 30),
 * and converts it into a UTC Date locked to 00:00:00.000Z.
 */
export function parseDateOnlyUTC(dateString: string): Date {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }
  const [, yearStr, monthStr, dayStr] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() + 1 !== month ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error("Invalid calendar date.");
  }
  return utcDate;
}

/**
 * Zod schema for an optional YYYY-MM-DD string.
 * Transforms empty strings to undefined, parses to UTC Date, and handles nulls for DB removal.
 */
export const zOptionalDateString = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val))
  .refine(
    (val) => {
      if (!val) return true;
      try {
        parseDateOnlyUTC(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid date format. Expected YYYY-MM-DD." },
  )
  .transform((val) => (val ? parseDateOnlyUTC(val) : null));

/**
 * Zod schema for standard ISO string validation.
 */
export const zIsoDateString = z
  .string()
  .nullable()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    },
    { message: "Invalid date." },
  );
