import { test, expect } from "@playwright/test";

const USERS = {
  admin: {
    email: "admin@example.com",
    password: "TestAdmin@123",
    expectedLanding: "/admin",
  },
  teacher: {
    email: "teacher@example.com",
    password: "TestTeacher@123",
    expectedLanding: "/teacher",
  },
  student: {
    email: "student@example.com",
    password: "TestStudent@123",
    expectedLanding: "/student",
  },
};

async function login(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test.describe("CUJ-1: Authentication Lifecycle", () => {
  test("Login page renders with correct structure", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByText(/forgot password/i)).toBeVisible();
  });

  test("Invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill("wrong@example.com");
    await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("Empty form shows field validation", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
  });

  test.describe("Role-based routing", () => {
    for (const [role, creds] of Object.entries(USERS)) {
      test(`${role} logs in and lands on ${creds.expectedLanding}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") errors.push(msg.text());
        });

        await login(page, creds.email, creds.password);
        await page.waitForURL(`**${creds.expectedLanding}**`);
        expect(page.url()).toContain(creds.expectedLanding);
        await page.waitForTimeout(1000);

        const filtered = errors.filter((e) => !e.includes("axe-core"));
        expect(filtered).toEqual([]);
      });
    }
  });

  test("Logout clears session and prevents back navigation", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await page.waitForURL("**/admin**");
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");

    // Verify can't access protected page after logout
    await page.goto("/admin");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");

    // Browser back after logout also redirects to login
    await page.goBack();
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("Unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("Unauthorized role access redirects", async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await page.waitForURL("**/admin**");

    // Admin visits /student — should redirect back to admin
    await page.goto("/student");
    await page.waitForURL("**/admin**");
    expect(page.url()).toContain("/admin");
  });

  test("Password reset page is accessible", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /reset your password/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("Login page has no redirect loop", async ({ page }) => {
    await page.goto("/login");
    expect(page.url()).toContain("/login");
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });
});
