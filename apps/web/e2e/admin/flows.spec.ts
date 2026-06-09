import { test, expect } from "../fixtures";

test.describe("admin ticket flows", () => {
  test("can view ticket list and navigate to detail", async ({ page }) => {
    await page.goto("/admin/tickets");
    await expect(page.getByRole("heading", { name: "Tickets", exact: true }).first()).toBeVisible();

    const ticketLink = page.locator("a[href*='/admin/tickets/']").first();
    if (await ticketLink.isVisible()) {
      await ticketLink.click();
      await expect(page).toHaveURL(/\/admin\/tickets\//);
    }
  });

  test("shows not-found for unknown ticket", async ({ page }) => {
    await page.goto("/admin/tickets/does-not-exist");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe("admin user flows", () => {
  test("can view user list and navigate to detail", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();

    const userLink = page.locator("a[href*='/admin/users/']").first();
    if (await userLink.isVisible()) {
      await userLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
    }
  });

  test("shows not-found for unknown user", async ({ page }) => {
    await page.goto("/admin/users/does-not-exist");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe("admin organization flows", () => {
  test("can view org list and navigate to detail", async ({ page }) => {
    await page.goto("/admin/organizations");
    await expect(page.getByRole("heading", { name: /organizations/i })).toBeVisible();

    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page).toHaveURL(/\/admin\/organizations\//);
    }
  });

  test("org detail shows basics form", async ({ page }) => {
    await page.goto("/admin/organizations");
    const orgLink = page.locator("a[href*='/admin/organizations/']").first();
    if (await orgLink.isVisible()) {
      await orgLink.click();
      await expect(page.getByText(/organization basics|name/i).first()).toBeVisible();
      await expect(page.getByText(/domains/i).first()).toBeVisible();
      await expect(page.getByText(/memberships/i).first()).toBeVisible();
    }
  });
});

test.describe("admin project flows", () => {
  test("can view project list and navigate to detail", async ({ page }) => {
    await page.goto("/admin/projects");
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();

    const projectLink = page.locator("a[href*='/admin/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page.getByText(/project/i).first()).toBeVisible();
    }
  });

  test("project detail shows task list section", async ({ page }) => {
    await page.goto("/admin/projects");
    const projectLink = page.locator("a[href*='/admin/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await expect(page.getByText(/task/i).first()).toBeVisible();
    }
  });
});

test.describe("admin document flows", () => {
  test("can view document list", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("has view mode toggles", async ({ page }) => {
    await page.goto("/admin/documents");
    await expect(page.getByRole("button", { name: /list/i })).toBeVisible();
  });
});

test.describe("portal flows", () => {
  test("portal dashboard loads with org name", async ({ page }) => {
    await page.goto("/portal/dashboard");
    await expect(page.getByText(/organization|company/i).first()).toBeVisible();
  });

  test("portal has navigation links", async ({ page }) => {
    await page.goto("/portal/dashboard");
    await expect(page.getByRole("link", { name: /documents/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Support", exact: true })).toBeVisible();
  });

  test("portal documents page loads", async ({ page }) => {
    await page.goto("/portal/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("portal support page loads", async ({ page }) => {
    await page.goto("/portal/support");
    await expect(page.getByRole("heading", { name: "Support", exact: true })).toBeVisible();
  });
});

test.describe("cross-navigation flows", () => {
  test("can navigate between admin sections", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Users", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Organizations", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Tickets", exact: true })).toBeVisible();
  });

  test("can navigate from user detail back to users list", async ({ page }) => {
    await page.goto("/admin/users");
    const userLink = page.locator("a[href*='/admin/users/']").first();
    if (await userLink.isVisible()) {
      await userLink.click();
      const backLink = page.getByRole("link", { name: /back|users/i });
      if (await backLink.isVisible()) {
        await backLink.click();
        await expect(page).toHaveURL(/\/admin\/users$/);
      }
    }
  });
});
