import { test, expect } from "../fixtures";

test.describe("admin dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("renders overview heading", async ({ page }) => {
    await expect(page.getByText(/overview/i).first()).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    await expect(page.getByText(/users|organizations|projects|tickets/i).first()).toBeVisible();
  });

  test("shows pending approvals section", async ({ page }) => {
    await expect(page.getByText(/pending.*approvals|approvals/i).first()).toBeVisible();
  });

  test("admin page loads", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
  });
});
