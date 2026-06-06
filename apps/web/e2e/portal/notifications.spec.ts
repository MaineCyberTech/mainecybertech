import { test, expect } from "../fixtures";

test.describe("portal notification bell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/dashboard");
  });

  test("shows notification bell in header", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("opens dropdown on click", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await bell.click();
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });

  test("dropdown shows state", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await bell.click();
    await expect(page.getByText(/no new notifications|mark all read/i).first()).toBeVisible();
  });
});

test.describe("admin notification bell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("shows notification bell in admin header", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("opens dropdown on click in admin", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await bell.click();
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });
});
