import { test, expect } from "@playwright/test";

const publicPages = [
  { path: "/", title: /Study Point/i },
  { path: "/about", title: /About/i },
  { path: "/courses", title: /Courses/i },
  { path: "/resources", title: /Resources/i },
  { path: "/announcements", title: /Announcements/i },
  { path: "/contact", title: /Contact/i },
  { path: "/admissions", title: /Admissions/i },
];

function collectErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (exception) => errors.push(exception.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      // Filter out axe-core accessibility violations (expected in dev mode)
      if (msg.text().includes("Heading order invalid")) return;
      consoleErrors.push(msg.text());
    }
  });
  return { errors, consoleErrors };
}

test.describe("Public Pages", () => {
  for (const pageInfo of publicPages) {
    test(`Page ${pageInfo.path} loads with correct title and no console errors`, async ({
      page,
    }) => {
      const { errors, consoleErrors } = collectErrors(page);

      const response = await page.goto(pageInfo.path);
      expect(response?.status()).toBe(200);

      await expect(page).toHaveTitle(pageInfo.title);

      expect(errors).toEqual([]);
      expect(consoleErrors).toEqual([]);
    });
  }
});
