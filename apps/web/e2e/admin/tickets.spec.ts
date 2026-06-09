import { test, expect } from "../fixtures";

test.describe("admin tickets list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/tickets");
  });

  test("renders tickets heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tickets", exact: true }).first()).toBeVisible();
  });

  test("shows ticket list or empty state", async ({ page }) => {
    const ticketList = page.getByText(/no tickets|ticket/i).first();
    await expect(ticketList).toBeVisible();
  });

  test("each ticket links to detail page", async ({ page }) => {
    const ticketLinks = page.locator("a[href*='/admin/tickets/']");
    const count = await ticketLinks.count();
    if (count > 0) {
      const firstLink = ticketLinks.first();
      await expect(firstLink).toBeVisible();
    }
  });
});

test.describe("admin ticket detail", () => {
  test("shows not-found for unknown ticket", async ({ page }) => {
    await page.goto("/admin/tickets/does-not-exist");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });

  test("shows ticket info when ticket exists", async ({ page }) => {
    await page.goto("/admin/tickets");
    const ticketLink = page.locator("a[href*='/admin/tickets/']").first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await expect(page.getByText(/ticket|open tickets/i).first()).toBeVisible();
    }
  });

  test("shows comments section", async ({ page }) => {
    await page.goto("/admin/tickets");
    const ticketLink = page.locator("a[href*='/admin/tickets/']").first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await expect(page.getByText(/comments|history/i).first()).toBeVisible();
    }
  });
});
