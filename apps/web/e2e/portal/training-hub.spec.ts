import { test, expect } from "../fixtures";

test.describe("portal training hub page", () => {
  test("renders training hub heading", async ({ page }) => {
    await page.goto("/portal/training-hub");
    await expect(page.getByRole("heading", { name: /training hub/i })).toBeVisible();
  });

  test("shows course list or empty state", async ({ page }) => {
    await page.goto("/portal/training-hub");
    await expect(page.getByText(/course|microlearning|difficulty/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/training-hub");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
