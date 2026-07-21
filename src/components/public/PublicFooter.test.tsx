// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PublicFooter } from "./PublicFooter";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("PublicFooter", () => {
  const defaultSettings = {
    instituteName: "Study Point",
    tagline: "Excellence in Mathematics",
    phone: "+91 98765 43210",
    whatsappNumber: "+91 98765 43210",
    email: "hello@studypoint.example.com",
    address: "Mathematics Department, City Centre",
    landmark: "Near City Mall",
    mapUrl: "https://maps.example.com",
    openingHours: "Mon-Sat 9AM-7PM",
    socialLinks: {
      twitter: "https://twitter.com/test",
      instagram: "https://instagram.com/test",
    },
    logoFileId: null,
    faviconFileId: null,
  };

  it("1. renders institute name", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByText("Study Point")).toBeInTheDocument();
  });

  it("2. renders tagline", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByText("Excellence in Mathematics")).toBeInTheDocument();
  });

  it("3. renders contact information", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByText(/91 98765 43210/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /WhatsApp/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /hello@studypoint.example.com/i }),
    ).toBeInTheDocument();
  });

  it("4. renders address and landmark", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByText("Mathematics Department, City Centre")).toBeInTheDocument();
    expect(screen.getByText("Near Near City Mall")).toBeInTheDocument();
  });

  it("5. sends map enquiries to the contact page", () => {
    render(<PublicFooter settings={defaultSettings} />);
    const mapLink = screen.getByRole("link", { name: /View on Map/i });
    expect(mapLink).toBeInTheDocument();
    expect(mapLink).toHaveAttribute("href", "/contact");
  });

  it("6. renders opening hours", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByText("Mon-Sat 9AM-7PM")).toBeInTheDocument();
  });

  it("7. renders social links", () => {
    render(<PublicFooter settings={defaultSettings} />);
    // Social links are identified by their href
    expect(screen.getByRole("link", { name: /twitter/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /instagram/i })).toBeInTheDocument();
  });

  it("8. renders quick links", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByRole("link", { name: /About/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Courses/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Resources/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Notices/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Admissions/i })).toBeInTheDocument();
  });

  it("9. renders copyright with current year", () => {
    render(<PublicFooter settings={defaultSettings} />);
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} Study Point. All rights reserved.`),
    ).toBeInTheDocument();
  });

  it("10. renders privacy and terms links", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByRole("link", { name: /Privacy/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Terms/i })).toBeInTheDocument();
  });

  it("11. handles missing optional fields gracefully", () => {
    render(
      <PublicFooter
        settings={{
          instituteName: "Test",
          tagline: null,
          phone: null,
          whatsappNumber: null,
          email: null,
          address: null,
          landmark: null,
          mapUrl: null,
          openingHours: null,
          socialLinks: null,
        }}
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Call/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
  });

  it("12. handles null settings gracefully", () => {
    render(<PublicFooter settings={null} />);
    expect(screen.getByText("Study Point")).toBeInTheDocument();
  });

  it("13. renders map link", () => {
    render(<PublicFooter settings={defaultSettings} />);
    // The map link has "View on Map" as its text content
    expect(screen.getByRole("link", { name: /View on Map/i })).toBeInTheDocument();
  });

  it("14. renders social links with correct icons", () => {
    render(<PublicFooter settings={defaultSettings} />);
    // Social links have aria-labels on the icons
    const twitterLink = screen.getByRole("link", { name: /twitter/i });
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink.querySelector("svg")).toBeInTheDocument();

    const instagramLink = screen.getByRole("link", { name: /instagram/i });
    expect(instagramLink).toBeInTheDocument();
    expect(instagramLink.querySelector("svg")).toBeInTheDocument();
  });

  it("15. footer has correct semantic elements", () => {
    render(<PublicFooter settings={defaultSettings} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
