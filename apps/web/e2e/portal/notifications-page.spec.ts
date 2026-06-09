import { test, expect } from "../fixtures";

test.describe("portal notifications page", () => {
  test("renders notifications heading", async ({ page }) => {
    await page.goto("/portal/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  });

  test("shows filter controls", async ({ page }) => {
    await page.goto("/portal/notifications");
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("has link to preferences", async ({ page }) => {
    await page.goto("/portal/notifications");
    await expect(page.getByRole("link", { name: /preferences/i })).toBeVisible();
  });

  test("preferences page renders", async ({ page }) => {
    await page.goto("/portal/notifications/preferences");
    await expect(page.getByRole("heading", { name: /preferences/i })).toBeVisible();
  });

  test("preferences shows save button", async ({ page }) => {
    await page.goto("/portal/notifications/preferences");
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("admin notifications page", () => {
  test("renders notifications heading", async ({ page }) => {
    await page.goto("/admin/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
  });
});
