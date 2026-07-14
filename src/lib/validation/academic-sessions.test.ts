import { describe, it, expect } from "vitest";
import { parseDateOnlyUTC } from "./common";
import { SessionCreateSchema } from "./academic-sessions";

describe("Academic Session Validation", () => {
  describe("parseDateOnlyUTC", () => {
    it("parses valid YYYY-MM-DD correctly to UTC midnight", () => {
      const d = parseDateOnlyUTC("2026-07-07");
      expect(d.toISOString()).toBe("2026-07-07T00:00:00.000Z");
    });

    it("throws on invalid format", () => {
      expect(() => parseDateOnlyUTC("2026/07/07")).toThrow("Invalid date format");
      expect(() => parseDateOnlyUTC("07-07-2026")).toThrow("Invalid date format");
      expect(() => parseDateOnlyUTC("2026-7-7")).toThrow("Invalid date format");
    });

    it("throws on impossible calendar dates", () => {
      expect(() => parseDateOnlyUTC("2026-02-30")).toThrow("Invalid calendar date");
      expect(() => parseDateOnlyUTC("2026-13-01")).toThrow("Invalid calendar date");
      expect(() => parseDateOnlyUTC("2026-04-31")).toThrow("Invalid calendar date");
    });
  });

  describe("SessionCreateSchema", () => {
    it("trims and rejects empty names", () => {
      const res = SessionCreateSchema.safeParse({ name: "   " });
      expect(res.success).toBe(false);
    });

    it("normalizes empty strings to null for dates", () => {
      const res = SessionCreateSchema.safeParse({
        name: "Session",
        startsOn: "",
        endsOn: "   ",
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.startsOn).toBeNull();
        expect(res.data.endsOn).toBeNull();
      }
    });

    it("validates startsOn <= endsOn", () => {
      const res = SessionCreateSchema.safeParse({
        name: "Session",
        startsOn: "2026-07-08",
        endsOn: "2026-07-07",
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe(
          "Start date must be on or before the end date.",
        );
      }
    });
  });
});
