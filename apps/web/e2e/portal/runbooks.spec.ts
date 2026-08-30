import { test, expect } from "../fixtures";

test.describe("portal runbooks page", () => {
  test("renders runbooks heading", async ({ page }) => {
    await page.goto("/portal/runbooks");
    await expect(page.getByRole("heading", { name: /runbooks/i })).toBeVisible();
  });

  test("shows runbook list or empty state", async ({ page }) => {
    await page.goto("/portal/runbooks");
    await expect(page.getByText(/runbook|category|version|found/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/runbooks");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
