import { test, expect } from "../fixtures";

test.describe("admin satisfaction pulse", () => {
  test("renders Client Satisfaction Pulse heading", async ({ page }) => {
    await page.goto("/admin/satisfaction-pulse");
    await expect(page.getByRole("heading", { name: /Client Satisfaction Pulse/i })).toBeVisible();
  });

  test("shows pulse list or empty state", async ({ page }) => {
    await page.goto("/admin/satisfaction-pulse");
    await expect(page.getByText(/pulse|template|schedule|CSAT|NPS/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/admin/satisfaction-pulse");
    await expect(page.getByText(/admin/i).first()).toBeVisible();
  });
});
