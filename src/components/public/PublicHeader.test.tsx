// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, within } from "@testing-library/react";
import { PublicHeader } from "./PublicHeader";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("PublicHeader", () => {
  const defaultSettings = {
    instituteName: "Study Point",
    phone: "+91 98765 43210",
    whatsappNumber: "+91 98765 43210",
    socialLinks: { twitter: "https://twitter.com/test" },
  };

  it("1. renders institute name", () => {
    render(<PublicHeader settings={defaultSettings} />);
    expect(screen.getByText("Study Point")).toBeInTheDocument();
  });

  it("2. renders navigation links", () => {
    render(<PublicHeader settings={defaultSettings} />);
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText("Notices")).toBeInTheDocument();
    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText("Admissions")).toBeInTheDocument();
  });

  it("3. renders phone link when phone is provided", () => {
    render(<PublicHeader settings={defaultSettings} />);
    const phoneLink = screen.getByRole("link", { name: /Call \+91 98765 43210/i });
    expect(phoneLink).toBeInTheDocument();
    expect(phoneLink).toHaveAttribute("href", "tel:+919876543210");
  });

  it("4. does not render phone link when phone is not provided", () => {
    render(<PublicHeader settings={{ ...defaultSettings, phone: null }} />);
    expect(screen.queryByRole("link", { name: /Call/i })).not.toBeInTheDocument();
  });

  it("5. renders WhatsApp button", () => {
    render(<PublicHeader settings={defaultSettings} />);
    const whatsappButton = screen.getByRole("link", { name: /Contact via WhatsApp/i });
    expect(whatsappButton).toBeInTheDocument();
    expect(whatsappButton).toHaveAttribute("href", "https://wa.me/919876543210");
    expect(whatsappButton).toHaveAttribute("target", "_blank");
  });

  it("6. renders default institute name when settings is null", () => {
    render(<PublicHeader settings={null} />);
    expect(screen.getByText("Study Point")).toBeInTheDocument();
  });

  it("7. mobile menu opens and closes", async () => {
    render(<PublicHeader settings={defaultSettings} />);
    const menuButton = screen.getByRole("button", { name: /Open menu/i });
    expect(
      screen.queryByRole("navigation", { name: /Mobile navigation/i }),
    ).not.toBeInTheDocument();

    menuButton.click();
    const mobileNav = await screen.findByRole("navigation", {
      name: /Mobile navigation/i,
    });
    expect(mobileNav).toBeInTheDocument();
    // Use within to query within the mobile nav
    expect(within(mobileNav).getByText("About")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /Close menu/i });
    closeButton.click();
    await screen.findByRole("navigation", { name: /Mobile navigation/i, hidden: true });
    expect(
      screen.queryByRole("navigation", { name: /Mobile navigation/i }),
    ).not.toBeInTheDocument();
  });

  it("8. uses institute name from settings", () => {
    render(
      <PublicHeader
        settings={{
          instituteName: "Custom Institute",
          phone: null,
          whatsappNumber: null,
        }}
      />,
    );
    expect(screen.getByText("Custom Institute")).toBeInTheDocument();
  });

  it("9. renders triangle logo", () => {
    render(<PublicHeader settings={defaultSettings} />);
    expect(screen.getByText("△")).toBeInTheDocument();
  });

  it("10. home link navigates to root", () => {
    render(<PublicHeader settings={defaultSettings} />);
    const homeLink = screen.getByRole("link", { name: /Study Point - Home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
