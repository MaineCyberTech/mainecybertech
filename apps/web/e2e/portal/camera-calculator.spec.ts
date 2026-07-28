import { test, expect } from "../fixtures";

test.describe("portal camera calculator page", () => {
  test("renders camera calculator heading", async ({ page }) => {
    await page.goto("/portal/camera-calculator");
    await expect(page.getByRole("heading", { name: /camera calculator/i })).toBeVisible();
  });

  test("shows calculator form or empty state", async ({ page }) => {
    await page.goto("/portal/camera-calculator");
    await expect(page.getByText(/camera|calculator|lens|fov/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/camera-calculator");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
