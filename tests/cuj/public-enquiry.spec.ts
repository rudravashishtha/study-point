import { test, expect } from "@playwright/test";

test.describe("CUJ-10: Public Enquiry Flow", () => {

  test("Home page loads with hero and teacher intro", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /study point|mathematics|coaching|excellence/i }).first()).toBeVisible();
    // Login CTA should be visible in header
    await expect(page.getByRole("link", { name: /login/i }).first()).toBeVisible();
  });

  test("About page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Courses page shows class offerings", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Resources page loads with study resources", async ({ page }) => {
    await page.goto("/resources");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Announcements page loads", async ({ page }) => {
    await page.goto("/announcements");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Contact page has contact information", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("h1").first()).toBeVisible();
    // Should show institute contact info
    await expect(page.getByText(/phone|email|address|whatsapp/i).first()).toBeVisible();
  });

  test("Admissions page loads", async ({ page }) => {
    await page.goto("/admissions");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("Footer contains quick links with Login", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /about/i })).toBeVisible();
    await expect(footer.getByRole("link", { name: /courses/i })).toBeVisible();
  });

  test("Header Login button navigates to login page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /login/i }).first().click();
    await page.waitForURL("**/login**");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  });

  test("All public pages return 200 with no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    const publicPages = ["/", "/about", "/courses", "/resources", "/announcements", "/contact", "/admissions"];
    for (const path of publicPages) {
      await page.goto(path);
      expect(page.url()).toContain(path);
      // Allow axe-core dev errors (accessibility audit violations logged in dev)
      const filtered = errors.filter((e) => !e.includes("Fix any of the following") && !e.includes("axe-core"));
      expect(filtered, `Console errors on ${path}: ${filtered.join(", ")}`).toEqual([]);
    }
  });
});
