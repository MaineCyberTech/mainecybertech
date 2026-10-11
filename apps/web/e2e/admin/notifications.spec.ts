import { test, expect, gotoApp } from "../fixtures";

test.describe("admin notification bell", () => {
  test.beforeEach(async ({ page }) => {
    // gotoApp waits for the authenticated shell so a transient layout fetch
    // failure gives a deterministic failure point instead of a bell timeout
    // (TEST-P2-003 names these specs as the flaky set).
    await gotoApp(page, "/admin");
  });

  test("shows notification bell in admin header", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await expect(bell).toBeVisible();
  });

  test("opens notification dropdown on click", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await bell.click();
    await expect(page.getByText("Notifications").first()).toBeVisible();
  });

  test("has notifications section in dropdown", async ({ page }) => {
    const bell = page.getByLabel(/notifications/i);
    await bell.click();
    await expect(page.getByText(/no new notifications|mark all read/i).first()).toBeVisible();
  });
});
