import { describe, it, expect } from "vitest";
import { handleActionError } from "../actions/errors";
import { DomainError } from "./errors";
import { z } from "zod";

describe("Action Error Mapping", () => {
  it("maps DomainError to ActionResult", () => {
    const error = new DomainError(
      "DUPLICATE_IDENTITY",
      "Identity already exists",
      "code",
    );
    const result = handleActionError(error);

    expect(result).toEqual({
      success: false,
      error: "Identity already exists",
      fieldErrors: { code: ["Identity already exists"] },
    });
  });

  it("maps ZodError to ActionResult", () => {
    const schema = z.object({ code: z.string().min(2) });
    const parsed = schema.safeParse({ code: "a" });
    if (!parsed.success) {
      const result = handleActionError(parsed.error);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Validation failed. Please check your inputs.");
      expect(result.fieldErrors?.code).toBeDefined();
    } else {
      expect.fail("Expected validation to fail");
    }
  });

  it("masks generic unknown errors", () => {
    const error = new Error("Database connection failed randomly");
    const result = handleActionError(error);

    expect(result).toEqual({
      success: false,
      error: "An unexpected error occurred. Please try again.",
    });
  });
});
