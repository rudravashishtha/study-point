import { describe, it, expect } from "vitest";
import { buildWhatsAppHref } from "./WhatsAppButton";

describe("buildWhatsAppHref", () => {
  it("strips non-digits from the phone number", () => {
    expect(buildWhatsAppHref("+91 98765 43210")).toBe("https://wa.me/919876543210");
  });

  it("returns # when no phone number is provided", () => {
    expect(buildWhatsAppHref(null)).toBe("#");
    expect(buildWhatsAppHref(undefined)).toBe("#");
    expect(buildWhatsAppHref("")).toBe("#");
  });

  it("appends an encoded message when provided", () => {
    expect(buildWhatsAppHref("919876543210", "Hello there")).toBe(
      "https://wa.me/919876543210?text=Hello%20there",
    );
  });

  it("encodes special characters in the message", () => {
    expect(buildWhatsAppHref("919876543210", "a&b=c d")).toBe(
      "https://wa.me/919876543210?text=a%26b%3Dc%20d",
    );
  });

  it("omits the query string when the message is empty", () => {
    expect(buildWhatsAppHref("919876543210", "")).toBe("https://wa.me/919876543210");
  });
});
