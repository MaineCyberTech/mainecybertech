import { test, expect } from "../fixtures";

test.describe("jira integration badges", () => {
  test("admin ticket list shows JSM issue key", async ({ page }) => {
    await page.goto("/admin/tickets");
    const badge = page.getByText(/HELPDESK-/).first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });

  test("admin ticket detail shows JSM fields", async ({ page }) => {
    await page.goto("/admin/tickets");
    const ticketLink = page.locator("a[href*='/admin/tickets/']").first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      const badge = page.getByText(/HELPDESK-/).first();
      await expect(badge).toBeVisible({ timeout: 5000 });
    }
  });

  test("admin project list shows Jira project key", async ({ page }) => {
    await page.goto("/admin/projects");
    const badge = page.getByText(/SEC|INFRA/).first();
    await expect(badge).toBeVisible({ timeout: 5000 });
  });
});

test.describe("document version history", () => {
  test("document list page renders", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });
});

test.describe("notification preferences", () => {
  test("preferences page has save button", async ({ page }) => {
    await page.goto("/portal/notifications/preferences");
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 10000 });
  });

  test("preferences page shows modules", async ({ page }) => {
    await page.goto("/portal/notifications/preferences");
    await expect(page.getByText(/tickets/i).or(page.getByText(/projects/i))).toBeVisible();
  });
});

test.describe("webhook delivery log", () => {
  test("webhook list page renders", async ({ page }) => {
    await page.goto("/admin/webhooks");
    await expect(page.getByRole("heading", { name: /webhook/i })).toBeVisible();
  });
});
