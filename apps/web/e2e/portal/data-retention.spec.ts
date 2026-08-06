import { test, expect } from "../fixtures";

test.describe("portal data retention page", () => {
  test("renders data retention heading", async ({ page }) => {
    await page.goto("/portal/data-retention");
    await expect(page.getByRole("heading", { name: /data retention policies/i })).toBeVisible();
  });

  test("shows retention list or empty state", async ({ page }) => {
    await page.goto("/portal/data-retention");
    await expect(page.getByText(/retention polic|disposal|regulated/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/data-retention");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
