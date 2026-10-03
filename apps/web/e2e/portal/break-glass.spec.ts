import { test, expect } from "../fixtures";

test.describe("portal break glass page", () => {
  test("renders break glass heading", async ({ page }) => {
    await page.goto("/portal/break-glass");
    await expect(page.getByRole("heading", { name: /break glass/i })).toBeVisible();
  });

  test("shows break glass status or empty state", async ({ page }) => {
    await page.goto("/portal/break-glass");
    await expect(page.getByText(/break glass|emergency|access/i).first()).toBeVisible();
  });

  test("shows breadcrumbs", async ({ page }) => {
    await page.goto("/portal/break-glass");
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /portal/i }),
    ).toBeVisible();
  });
});
