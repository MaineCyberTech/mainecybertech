import { test, expect } from "../fixtures";

test.describe("portal sla metrics page", () => {
  test("renders sla metrics heading", async ({ page }) => {
    await page.goto("/portal/sla");
    await expect(page.getByRole("heading", { name: /sla metrics/i })).toBeVisible();
  });

  test("shows summary or empty state", async ({ page }) => {
    await page.goto("/portal/sla");
    await expect(page.getByText(/sla|summary|breach|metric|total/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/sla");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
