import { test, expect } from "../fixtures";

test.describe("portal time entries page", () => {
  test("renders time entries heading", async ({ page }) => {
    await page.goto("/portal/time-entries");
    await expect(page.getByRole("heading", { name: /time entries/i })).toBeVisible();
  });

  test("shows time entry list or empty state", async ({ page }) => {
    await page.goto("/portal/time-entries");
    await expect(
      page.getByText(/time entries for your organization|billable|no time entries found/i).first(),
    ).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/time-entries");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
