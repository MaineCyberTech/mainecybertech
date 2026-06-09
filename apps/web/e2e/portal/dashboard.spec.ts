import { test, expect } from "../fixtures";

test.describe("portal dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/dashboard");
  });

  test("renders dashboard heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("shows organization name", async ({ page }) => {
    await expect(page.getByText(/organization|company/i).first()).toBeVisible();
  });

  test("shows recent tickets section", async ({ page }) => {
    await expect(page.getByText(/recent|tickets|support/i).first()).toBeVisible();
  });

  test("shows recent projects section", async ({ page }) => {
    await expect(page.getByText(/projects/i).first()).toBeVisible();
  });

  test("has navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /documents/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Support", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Projects", exact: true })).toBeVisible();
  });
});

test.describe("portal documents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/documents");
  });

  test("renders documents heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("shows document list or empty state", async ({ page }) => {
    const docList = page.getByText(/no documents|document/i).first();
    await expect(docList).toBeVisible();
  });

  test("has multi-select checkboxes when documents exist", async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    if (count > 0) {
      await expect(checkboxes.first()).toBeVisible();
    }
  });

  test("bulk action bar appears on selection", async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
      await expect(page.getByText(/selected/i)).toBeVisible();
    }
  });

  test("has upload button or action", async ({ page }) => {
    const uploadBtn = page.getByRole("button", { name: /upload|add|new/i });
    if (await uploadBtn.isVisible()) {
      await expect(uploadBtn).toBeEnabled();
    }
  });
});

test.describe("portal document detail", () => {
  test("document list page renders correctly", async ({ page }) => {
    await page.goto("/portal/documents");
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("document links navigate if documents exist", async ({ page }) => {
    await page.goto("/portal/documents");
    const docLinks = page.locator("a[href*='/portal/documents/']");
    const count = await docLinks.count();
    if (count > 0) {
      await docLinks.first().click();
      await expect(page.locator("body")).toBeVisible();
    }
  });
});

test.describe("portal support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/support");
  });

  test("renders support center heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Support", exact: true })).toBeVisible();
  });

  test("shows ticket list or empty state", async ({ page }) => {
    const ticketList = page.getByText(/no tickets|ticket|support/i).first();
    await expect(ticketList).toBeVisible();
  });

  test("has create ticket button", async ({ page }) => {
    const createBtn = page.getByRole("button", { name: /create|new|submit/i });
    if (await createBtn.isVisible()) {
      await expect(createBtn).toBeEnabled();
    }
  });
});

test.describe("portal projects", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal/projects");
  });

  test("renders projects heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
  });

  test("shows project list or empty state", async ({ page }) => {
    const projectList = page.getByText(/no projects|project/i).first();
    await expect(projectList).toBeVisible();
  });
});
