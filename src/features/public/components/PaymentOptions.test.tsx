// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PaymentOptions } from "./PaymentOptions";

afterEach(() => cleanup());

const plans = [
  {
    id: "annual",
    name: "Class IX Annual Fee",
    frequency: "YEARLY" as const,
    totalAmount: 12000,
    instalments: [{ id: "annual-payment", label: "Annual payment", amount: 12000 }],
  },
  {
    id: "instalments",
    name: "Class IX - Instalments",
    frequency: "CUSTOM" as const,
    totalAmount: 14000,
    instalments: [
      { id: "first", label: "First payment", amount: 7000 },
      { id: "second", label: "Second payment", amount: 7000 },
    ],
  },
  {
    id: "monthly",
    name: "Class IX - Monthly",
    frequency: "MONTHLY" as const,
    totalAmount: 16800,
    instalments: [
      { id: "month-one", label: "Month 1", amount: 1400 },
      { id: "month-two", label: "Month 2", amount: 1400 },
    ],
  },
];

describe("PaymentOptions", () => {
  it("leads with the lowest configured payment and keeps totals behind a disclosure", () => {
    render(<PaymentOptions plans={plans} />);

    expect(screen.getByText("Payments from ₹1,400")).toBeInTheDocument();
    expect(screen.getByText("Choose how you'd like to pay")).toBeInTheDocument();
    expect(screen.getByText("View payment options")).toBeInTheDocument();
    expect(screen.getByText("Annual payment").closest("details")).not.toHaveAttribute(
      "open",
    );
  });

  it("uses payment cadence rather than admin fee-plan names and explains genuine annual savings", () => {
    render(<PaymentOptions plans={plans} />);

    screen.getByText("View payment options").click();

    expect(screen.getByText("Annual payment")).toBeInTheDocument();
    expect(screen.getByText("Easy instalments")).toBeInTheDocument();
    expect(screen.getByText("Monthly plan")).toBeInTheDocument();
    expect(screen.getByText("Best value")).toBeInTheDocument();
    expect(
      screen.getByText("Save ₹4,800 compared with the monthly plan."),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Total fee")).toHaveLength(3);
    expect(screen.queryByText("Class IX Annual Fee")).not.toBeInTheDocument();
  });
});
