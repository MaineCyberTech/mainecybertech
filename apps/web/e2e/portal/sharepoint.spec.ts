import { test, expect } from "../fixtures";

test.describe("portal sharepoint page", () => {
  test("renders sharepoint heading", async ({ page }) => {
    await page.goto("/portal/sharepoint");
    await expect(page.getByRole("heading", { name: /sharepoint\s*&\s*teams/i })).toBeVisible();
  });

  test("shows configuration list or empty state", async ({ page }) => {
    await page.goto("/portal/sharepoint");
    await expect(
      page.getByText(/configuration|external sharing|no sharepoint configurations found/i).first(),
    ).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/sharepoint");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
