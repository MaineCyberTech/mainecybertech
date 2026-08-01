import { test, expect } from "../fixtures";

test.describe("portal hardware staging page", () => {
  test("renders hardware staging heading", async ({ page }) => {
    await page.goto("/portal/hardware-staging");
    await expect(page.getByRole("heading", { name: /hardware staging/i })).toBeVisible();
  });

  test("shows staging list or empty state", async ({ page }) => {
    await page.goto("/portal/hardware-staging");
    await expect(page.getByText(/hardware|staging|device|asset/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/hardware-staging");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
