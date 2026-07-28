import { test, expect } from "../fixtures";

test.describe("portal compliance readiness page", () => {
  test("renders compliance readiness heading", async ({ page }) => {
    await page.goto("/portal/compliance-readiness");
    await expect(page.getByRole("heading", { name: /compliance readiness/i })).toBeVisible();
  });

  test("shows compliance status or empty state", async ({ page }) => {
    await page.goto("/portal/compliance-readiness");
    await expect(page.getByText(/compliance|readiness|framework/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/compliance-readiness");
    await expect(page.getByRole("link", { name: /portal/i })).toBeVisible();
  });
});
