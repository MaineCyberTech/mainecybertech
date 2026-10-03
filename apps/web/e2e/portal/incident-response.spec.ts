import { test, expect } from "../fixtures";

test.describe("portal incident response page", () => {
  test("renders incident response heading", async ({ page }) => {
    await page.goto("/portal/incident-response");
    await expect(page.getByRole("heading", { name: /incident response/i })).toBeVisible();
  });

  test("shows incident list or empty state", async ({ page }) => {
    await page.goto("/portal/incident-response");
    await expect(page.getByText(/incident|response/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/incident-response");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
