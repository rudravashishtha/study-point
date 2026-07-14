/**
 * Student Portal — smoke + mobile polish coverage (Phase 8, Slice 8G)
 *
 * Prerequisites (must exist in the running environment):
 *  - A provisioned student auth user: student@example.com / TestStudent@123
 *    (create via the admin student-activation flow, or extend the seed). The
 *    existing CUJ auth-lifecycle contract already assumes this user exists.
 *  - The app must be running at the Playwright baseURL (http://localhost:3000).
 *
 * The fee receipt assertions are conditional: they run only when a paid or
 * partially-paid due exists for the student (see receipt test). When no paid/
 * partial due is seeded, the receipt path is documented as covered by the
 * StudentFeeStatus component test rather than failing here.
 */
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const STUDENT = { email: "student@example.com", password: "TestStudent@123" };

const routes = [
  { path: "/student", heading: /Dashboard/i },
  { path: "/student/course", heading: /My Course/i },
  { path: "/student/study-materials", heading: /Study Materials/i },
  { path: "/student/timetable", heading: /Timetable/i },
  { path: "/student/homework", heading: /Homework/i },
  { path: "/student/tests", heading: /Tests/i },
  { path: "/student/fees", heading: /Fees/i },
  { path: "/student/announcements", heading: /Notices/i },
];

async function loginAsStudent(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(STUDENT.email);
  await page.getByLabel("Password").fill(STUDENT.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/student**");
}

function trackConsoleErrors(page: Page): string[] {
  const consoleErrors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    // Filter out known dev-only accessibility noise.
    if (text.includes("axe-core") || text.includes("Heading order invalid")) return;
    consoleErrors.push(text);
  });
  return consoleErrors;
}

async function assertNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    metrics.scrollWidth,
    `horizontal overflow detected: scrollWidth=${metrics.scrollWidth} clientWidth=${metrics.clientWidth}`,
  ).toBeLessThanOrEqual(metrics.clientWidth);
}

const viewports = [
  { width: 390, height: 844 },
  { width: 414, height: 896 },
];

for (const viewport of viewports) {
  test.describe(`Student routes @ ${viewport.width}px`, () => {
    test.use({ viewport });

    for (const route of routes) {
      test(`${route.path} loads with heading, bottom nav, and no horizontal overflow`, async ({
        page,
      }) => {
        await loginAsStudent(page);
        const consoleErrors = trackConsoleErrors(page);

        await page.goto(route.path);
        expect(page.url()).toContain(route.path);
        await expect(
          page.getByRole("heading", { level: 1, name: route.heading }),
        ).toBeVisible();
        await expect(
          page.getByRole("navigation", { name: "Student navigation" }),
        ).toBeVisible();
        await assertNoHorizontalOverflow(page);

        expect(consoleErrors).toEqual([]);
      });
    }
  });
}

test.describe("Student bottom navigation (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("bottom nav is visible; More menu opens via tap and keyboard", async ({
    page,
  }) => {
    const consoleErrors = trackConsoleErrors(page);
    await loginAsStudent(page);

    const nav = page.getByRole("navigation", { name: "Student navigation" });
    await expect(nav).toBeVisible();

    const more = page.getByRole("button", { name: "More navigation items" });
    await expect(more).toBeVisible();

    // Tap opens the overflow menu.
    await more.click();
    const firstOverflow = page.getByRole("link", { name: "Work" });
    await expect(firstOverflow).toBeVisible();

    // Tapping outside closes it.
    await page.mouse.click(8, 8);
    await expect(firstOverflow).toBeHidden();

    // Keyboard: focus More, open with Enter, Tab focuses the first overflow item.
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(firstOverflow).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(firstOverflow).toBeFocused();

    // Close again for cleanliness.
    await page.mouse.click(8, 8);

    expect(consoleErrors).toEqual([]);
  });

  test("Notices badge is hidden on the Notices view (no stale badge)", async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto("/student/announcements");
    await expect(page.getByRole("heading", { level: 1, name: /Notices/i })).toBeVisible();

    // On the Notices view the unread badge must be cleared so it does not
    // linger after opening the page. Open the More menu and confirm the
    // Notices entry shows exactly "Notices" with no appended unread count.
    const more = page.getByRole("button", { name: "More navigation items" });
    await more.click();
    const notices = page.getByRole("link", { name: "Notices" });
    await expect(notices).toBeVisible();
    expect((await notices.innerText()).trim()).toBe("Notices");

    await page.mouse.click(8, 8);
  });
});

test.describe("Student fee receipt (conditional)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // Runs only when seeded paid/partial dues exist for the student. Otherwise
  // documented as manual + covered by the StudentFeeStatus component test.
  test("fee receipt view renders for a paid/partial due when present", async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.goto("/student/fees");

    const receiptLink = page.getByRole("link", { name: "Receipt" }).first();
    if ((await receiptLink.count()) === 0) {
      test.skip(
        true,
        "No seeded paid/partial fee due for student@example.com; receipt covered by StudentFeeStatus component test",
      );
      return;
    }

    await receiptLink.click();
    await expect(page.getByRole("heading", { name: /Fee Receipt/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Print/i })).toBeVisible();
  });
});
