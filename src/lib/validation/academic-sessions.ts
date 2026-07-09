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

const OptionalDateString = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val === "" ? undefined : val)) // Empty strings become undefined
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
  .transform((val) => (val ? parseDateOnlyUTC(val) : null)); // Null to ensure DB removal

export const SessionNameSchema = z
  .string()
  .trim()
  .min(2, "Session name must be at least 2 characters.");

const SessionBaseSchema = z
  .object({
    name: SessionNameSchema,
    startsOn: OptionalDateString,
    endsOn: OptionalDateString,
  })
  .refine(
    (data) => {
      if (data.startsOn && data.endsOn) {
        return data.startsOn.getTime() <= data.endsOn.getTime();
      }
      return true;
    },
    {
      message: "Start date must be on or before the end date.",
      path: ["endsOn"],
    },
  );

export const SessionCreateSchema = SessionBaseSchema;

// The update schema is explicitly NOT a partial. It requires the full editable payload.
export const SessionUpdateSchema = SessionBaseSchema;
