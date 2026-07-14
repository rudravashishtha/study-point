import { ZodError } from "zod";
import { DomainError } from "../domain/errors";

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

import { unstable_rethrow } from "next/navigation";

export function handleActionError(error: unknown): {
  success: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
} {
  unstable_rethrow(error);

  if (error instanceof ZodError) {
    return {
      success: false,
      error: "Validation failed. Please check your inputs.",
      fieldErrors: error.flatten().fieldErrors,
    };
  }

  if (error instanceof DomainError) {
    return {
      success: false,
      error: error.message,
      ...(error.field ? { fieldErrors: { [error.field]: [error.message] } } : {}),
    };
  }

  // Handle known Prisma errors safely if needed, but primarily these should be
  // wrapped in DomainErrors by the service layer.
  // We log the raw error internally for debugging.
  console.error("Unexpected Action Error:", error);

  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
  };
}
