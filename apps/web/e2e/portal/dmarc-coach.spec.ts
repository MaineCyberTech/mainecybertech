import { test, expect } from "../fixtures";

test.describe("portal dmarc coach page", () => {
  test("renders DMARC coach heading", async ({ page }) => {
    await page.goto("/portal/dmarc-coach");
    await expect(page.getByRole("heading", { name: /dmarc coach/i })).toBeVisible();
  });

  test("shows DMARC list or empty state", async ({ page }) => {
    await page.goto("/portal/dmarc-coach");
    await expect(page.getByText(/dmarc|domain|grade|issues/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/dmarc-coach");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
