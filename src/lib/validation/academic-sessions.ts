import { z } from "zod";

import { zOptionalDateString } from "./common";

export const SessionNameSchema = z
  .string()
  .trim()
  .min(2, "Session name must be at least 2 characters.");

const SessionBaseSchema = z
  .object({
    name: SessionNameSchema,
    startsOn: zOptionalDateString,
    endsOn: zOptionalDateString,
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
