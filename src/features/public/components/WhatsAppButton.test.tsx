import { describe, it, expect } from "vitest";
import { buildWhatsAppHref, buildAdmissionsEnquiryMessage } from "./WhatsAppButton";

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

describe("buildAdmissionsEnquiryMessage", () => {
  it("starts with a greeting derived from the institute name", () => {
    const message = buildAdmissionsEnquiryMessage({ instituteName: "Study Point" });
    expect(message).toBe("Hello Study Point, I would like to enquire about admissions.");
  });

  it("appends provided enquiry fields on separate lines", () => {
    const message = buildAdmissionsEnquiryMessage({
      instituteName: "Study Point",
      name: "Asha",
      phone: "+91 98765 43210",
      classLevel: "X",
      board: "CBSE",
      message: "Please share batch timings.",
    });
    expect(message).toBe(
      [
        "Hello Study Point, I would like to enquire about admissions.",
        "Name: Asha",
        "Phone: +91 98765 43210",
        "Class: X",
        "Board: CBSE",
        "Please share batch timings.",
      ].join("\n"),
    );
  });

  it("trims whitespace and omits empty fields", () => {
    const message = buildAdmissionsEnquiryMessage({
      instituteName: "Study Point",
      name: "  ",
      classLevel: "IX",
    });
    expect(message).toBe(
      ["Hello Study Point, I would like to enquire about admissions.", "Class: IX"].join(
        "\n",
      ),
    );
  });
});

describe("admissions enquiry WhatsApp URL", () => {
  it("builds a wa.me URL with an encoded multi-line message", () => {
    const message = buildAdmissionsEnquiryMessage({
      instituteName: "Study Point",
      name: "Asha",
      classLevel: "X",
      board: "CBSE",
    });
    const href = buildWhatsAppHref("919876543210", message);
    expect(href).toBe(
      "https://wa.me/919876543210?text=Hello%20Study%20Point%2C%20I%20would%20like%20to%20enquire%20about%20admissions.%0AName%3A%20Asha%0AClass%3A%20X%0ABoard%3A%20CBSE",
    );
  });
});
