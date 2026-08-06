import { test, expect } from "../fixtures";

test.describe("portal device profiles page", () => {
  test("renders device configuration profiles heading", async ({ page }) => {
    await page.goto("/portal/device-profiles");
    await expect(
      page.getByRole("heading", { name: /device configuration profiles/i }),
    ).toBeVisible();
  });

  test("shows profile list or empty state", async ({ page }) => {
    await page.goto("/portal/device-profiles");
    await expect(page.getByText(/device|profile|platform|os/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/device-profiles");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
