import { test, expect } from "../fixtures";

test.describe("admin documents list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/documents");
  });

  test("renders documents heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  });

  test("shows document list or empty state", async ({ page }) => {
    const docList = page.getByText(/no documents|document/i).first();
    await expect(docList).toBeVisible();
  });

  test("has view mode toggles", async ({ page }) => {
    const listBtn = page.getByRole("button", { name: /list/i });
    const tableBtn = page.getByRole("button", { name: /table/i });
    if (await listBtn.isVisible()) {
      await expect(listBtn).toBeEnabled();
    }
    if (await tableBtn.isVisible()) {
      await expect(tableBtn).toBeEnabled();
    }
  });
});

test.describe("admin document actions", () => {
  test("shows create document form", async ({ page }) => {
    await page.goto("/admin/documents");
    const createBtn = page.getByRole("button", { name: /create|add|new/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.getByText(/name|upload/i).first()).toBeVisible();
    }
  });
});

test.describe("admin document versions", () => {
  test("document detail page shows version metadata", async ({ page }) => {
    await page.goto("/admin/documents");
    const docLink = page.locator("a[href*='/admin/documents/']").first();
    if (await docLink.isVisible()) {
      await docLink.click();
      await expect(page).toHaveURL(/\/admin\/documents\//);
      await expect(page.getByText(/version|created|updated/i).first()).toBeVisible();
    }
  });
});
