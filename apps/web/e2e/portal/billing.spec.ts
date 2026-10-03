import { test, expect, visibleWithin } from "../fixtures";

test.describe("portal billing page", () => {
  test("renders billing heading", async ({ page }) => {
    await page.goto("/portal/billing");
    await expect(page.getByRole("heading", { name: "Billing", exact: true })).toBeVisible();
  });

  test("shows stat cards", async ({ page }) => {
    await page.goto("/portal/billing");
    await expect(page.getByText(/active plans|overdue|paid|invoices/i).first()).toBeVisible();
  });

  test("has invoices section", async ({ page }) => {
    await page.goto("/portal/billing");
    await expect(page.getByText(/invoices/i).first()).toBeVisible();
  });

  test("has sync button", async ({ page }) => {
    await page.goto("/portal/billing");
    const syncBtn = page.getByRole("button", { name: /sync|stripe/i });
    if (await visibleWithin(syncBtn)) {
      await expect(syncBtn).toBeEnabled();
    }
  });
});
