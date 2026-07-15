import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("login page renders properly with validation errors", async ({ page }) => {
    await page.goto("/login");

    // Check if the page renders
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();

    // Submit empty form to trigger validation errors
    await page.getByRole("button", { name: /sign in/i }).click();

    // Server action returns the first validation error (email)
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
  });

  test("student login renders error if not active", async () => {
    // To be implemented when we test the actual student flow
  });
});
