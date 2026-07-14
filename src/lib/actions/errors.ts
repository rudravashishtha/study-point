import { ZodError } from "zod";
import { DomainError } from "../domain/errors";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "./types";

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

  console.error("Unexpected Action Error:", error);

  return {
    success: false,
    error: "An unexpected error occurred. Please try again.",
  };
}
