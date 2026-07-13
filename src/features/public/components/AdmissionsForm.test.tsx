// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AdmissionsForm } from "./AdmissionsForm";

const originalLocation = window.location;

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { assign: vi.fn(), href: "" },
  });
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

describe("AdmissionsForm", () => {
  it("renders all fields and a submit button", () => {
    render(<AdmissionsForm whatsappNumber="919876543210" instituteName="Study Point" />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Class")).toBeInTheDocument();
    expect(screen.getByLabelText("Board")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i }),
    ).toBeInTheDocument();
  });

  it("shows validation errors and does not navigate when submitted empty", () => {
    render(<AdmissionsForm whatsappNumber="919876543210" instituteName="Study Point" />);
    fireEvent.click(screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i }));

    expect(screen.getByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your phone number.")).toBeInTheDocument();
    expect(screen.getByText("Please select a class.")).toBeInTheDocument();
    expect(screen.getByText("Please select a board.")).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("validates phone length", () => {
    render(<AdmissionsForm whatsappNumber="919876543210" instituteName="Study Point" />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "123" } });
    fireEvent.change(screen.getByLabelText("Class"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Board"), { target: { value: "CBSE" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i }));

    expect(
      screen.getByText("Please enter a valid 10-digit phone number."),
    ).toBeInTheDocument();
    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it("builds a pre-filled wa.me URL with encoded message on valid submit", () => {
    render(<AdmissionsForm whatsappNumber="919876543210" instituteName="Study Point" />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Class"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Board"), { target: { value: "CBSE" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i }));

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    const url = (window.location.assign as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as string;
    expect(url).toContain("https://wa.me/919876543210");
    expect(url).toContain("Hello%20Study%20Point");
    expect(url).toContain("Name%3A%20Asha");
    expect(url).toContain("Class%3A%20X");
    expect(url).toContain("Board%3A%20CBSE");
  });

  it("prevents duplicate submission", () => {
    render(<AdmissionsForm whatsappNumber="919876543210" instituteName="Study Point" />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Class"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Board"), { target: { value: "CBSE" } });
    const button = screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(window.location.assign).toHaveBeenCalledTimes(1);
  });

  it("does not navigate when no WhatsApp number is configured", () => {
    render(<AdmissionsForm whatsappNumber={null} instituteName="Study Point" />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Asha" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText("Class"), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText("Board"), { target: { value: "CBSE" } });
    fireEvent.click(screen.getByRole("button", { name: /Send Enquiry on WhatsApp/i }));

    expect(window.location.assign).not.toHaveBeenCalled();
  });
});
