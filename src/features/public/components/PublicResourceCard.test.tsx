// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PublicResourceCard, getResourceTypeMeta } from "./PublicResourceCard";

afterEach(() => cleanup());

const base = {
  id: "res-1",
  title: "Quadratic Equations Formula Sheet",
  description: "Key formulas for quick revision",
  resourceType: "DOCUMENT",
  publishedAt: new Date("2025-03-01"),
  fileAssetId: "file-1",
  externalLinkUrl: null,
};

describe("PublicResourceCard", () => {
  it("renders title, description and resource type label", () => {
    render(<PublicResourceCard resource={base} />);
    expect(screen.getByText("Quadratic Equations Formula Sheet")).toBeInTheDocument();
    expect(screen.getByText("Key formulas for quick revision")).toBeInTheDocument();
    expect(screen.getByText("Notes & PDFs")).toBeInTheDocument();
  });

  it("renders a guarded download link for file-based resources", () => {
    render(<PublicResourceCard resource={base} />);
    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "/api/public/materials/res-1/download");
  });

  it("renders an external open link when externalLinkUrl is set", () => {
    render(
      <PublicResourceCard
        resource={{
          ...base,
          fileAssetId: null,
          externalLinkUrl: "https://example.com/notes",
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /open/i });
    expect(link).toHaveAttribute("href", "https://example.com/notes");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders no action link when neither file nor external url exists", () => {
    render(
      <PublicResourceCard
        resource={{ ...base, fileAssetId: null, externalLinkUrl: null }}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("getResourceTypeMeta", () => {
  it("returns a human label and icon for known types", () => {
    expect(getResourceTypeMeta("LINK").label).toBe("External Link");
    expect(getResourceTypeMeta("DOCUMENT").label).toBe("Notes & PDFs");
  });

  it("falls back to the raw type for unknown values", () => {
    expect(getResourceTypeMeta("UNKNOWN").label).toBe("UNKNOWN");
  });
});
