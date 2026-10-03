import { test, expect } from "../fixtures";

test.describe("portal offboarding page", () => {
  test("renders offboarding heading", async ({ page }) => {
    await page.goto("/portal/offboarding");
    await expect(page.getByRole("heading", { name: /offboarding/i })).toBeVisible();
  });

  test("shows offboarding list or empty state", async ({ page }) => {
    await page.goto("/portal/offboarding");
    await expect(page.getByText(/offboarding|departure|offboard/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/offboarding");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
