import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const ADMIN = { email: "admin@example.com", password: "TestAdmin@123" };

test.describe("CUJ-2-9: Admin Workflows", () => {

  test("Admin login + dashboard + all sections + student/teacher/curriculum/fees/imports", async ({ page }) => {
    // --- Login once ---
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(ADMIN.email);
    await page.getByLabel("Password").fill(ADMIN.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("**/admin**");
    expect(page.url()).toContain("/admin");

    // --- CUJ-2: Dashboard has live metrics ---
    await expect(page.getByText("Active Students")).toBeVisible();
    const metricTexts = await page.locator(".text-2xl.font-bold.font-heading").allTextContents();
    for (const t of metricTexts) {
      expect(t.trim()).not.toBe("--");
    }

    // --- CUJ-3: Students ---
    await page.goto("/admin/students");
    await expect(page.getByText("STU-2026-0001")).toBeVisible();
    await page.getByRole("button", { name: /new student/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    await page.goto("/admin/students/activate");
    await expect(page.locator("h1").first()).toBeVisible();

    // --- CUJ-4: Teachers ---
    await page.goto("/admin/teachers");
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    // --- CUJ-5: Curriculum ---
    await page.goto("/admin/curriculum");
    await expect(page.getByText("Boards", { exact: true })).toBeVisible();

    await page.goto("/admin/academic-sessions");
    await expect(page.locator("table tbody tr").first()).toBeVisible();

    // --- CUJ-6: Homework ---
    await page.goto("/admin/homework");
    await expect(page.locator("h1").first()).toBeVisible();

    // --- CUJ-7: Materials ---
    await page.goto("/admin/materials");
    await expect(page.locator("h1").first()).toBeVisible();

    // --- CUJ-8: Fees ---
    await page.goto("/admin/fees");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.goto("/admin/fee-assignments");
    await expect(page.locator("h1").first()).toBeVisible();

    // --- CUJ-9: Imports ---
    await page.goto("/admin/imports");
    await expect(page.locator("h1").first()).toBeVisible();

    // --- All admin pages return 200 ---
    const adminPages = [
      "/admin", "/admin/students", "/admin/teachers", "/admin/batches",
      "/admin/curriculum", "/admin/academic-sessions", "/admin/homework",
      "/admin/materials", "/admin/tests", "/admin/fees",
      "/admin/fee-assignments", "/admin/announcements", "/admin/imports",
      "/admin/questions", "/admin/settings",
    ];
    for (const path of adminPages) {
      const resp = await page.request.get(path);
      expect(resp.ok(), `${path} returned ${resp.status()}`).toBeTruthy();
    }
  });
});
