import { describe, it, expect } from "vitest";
import { parseListParams } from "./search-params";

describe("URL Query Parsing Foundation", () => {
  it("applies safe defaults to empty params", () => {
    const params = parseListParams({}, ["name", "createdAt"], "createdAt");

    expect(params).toEqual({
      page: 1,
      pageSize: 20,
      archiveState: "active",
      sortField: "createdAt",
      sortDir: "asc",
      query: "",
    });
  });

  it("normalizes and caps page sizes, and handles decimal/zero/negative", () => {
    // Decimal and zero page
    const p1 = parseListParams({ page: "0", pageSize: "5000" }, ["name"], "name");
    expect(p1.page).toBe(1); // zero caught by catch(1) or positive() check
    expect(p1.pageSize).toBe(20);

    const p2 = parseListParams({ page: "1.5" }, ["name"], "name");
    expect(p2.page).toBe(1); // z.coerce.number().int() rejects decimal, catch(1) -> 1
  });

  it("handles repeated query parameters by using the first element", () => {
    const params = parseListParams(
      { page: ["2", "3"], sort: ["createdAt", "name"], q: ["first", "second"] },
      ["name", "createdAt"],
      "createdAt",
    );
    expect(params.page).toBe(2);
    expect(params.sortField).toBe("createdAt");
    expect(params.query).toBe("first");
  });

  it("allowlists sort fields", () => {
    // Valid sort
    const p1 = parseListParams({ sort: "name" }, ["name", "createdAt"], "createdAt");
    expect(p1.sortField).toBe("name");

    // Invalid sort falls back to default
    const p2 = parseListParams({ sort: "password" }, ["name", "createdAt"], "createdAt");
    expect(p2.sortField).toBe("createdAt");
  });

  it("parses archive state correctly", () => {
    const p1 = parseListParams({ archive: "all" }, ["name"], "name");
    expect(p1.archiveState).toBe("all");

    // Invalid falls back to 'active'
    const p2 = parseListParams({ archive: "invalid" }, ["name"], "name");
    expect(p2.archiveState).toBe("active");
  });
});
