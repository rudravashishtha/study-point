"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { publicIntakeSubmissionSchema } from "@/lib/validation/student-intake";
import { submitIntakeForm } from "@/server/services/student-intake";

function getClientIdentifier(headersList: Headers) {
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export async function submitIntakeAction(data: unknown) {
  try {
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList);
    const limit = rateLimit(`student-intake:${identifier}`, 8, 10 * 60 * 1000);
    if (!limit.success) {
      return {
        success: false,
        error: `Too many attempts. Please try again in ${limit.retryAfter ?? 60} seconds.`,
      };
    }

    const parsed = publicIntakeSubmissionSchema.parse(data);
    const result = await submitIntakeForm(parsed);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Please check the form and try again.",
      };
    }
    return { success: false, error: "Could not submit details." };
  }
}
