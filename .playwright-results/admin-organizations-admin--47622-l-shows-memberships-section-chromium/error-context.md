# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\organizations.spec.ts >> admin organization detail >> shows memberships section
- Location: e2e\admin\organizations.spec.ts:58:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/memberships/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/memberships/i).first()

```

```yaml
- banner:
  - text: Maine CyberTech
  - textbox "Search users, orgs, tickets, projects..."
  - img
  - button "Notifications (1 unread)":
    - img
    - text: "1"
  - link "Client Portal":
    - /url: /portal/dashboard
  - button "Sign Out"
  - paragraph: Admin operations workspace
- main:
  - navigation "Breadcrumb":
    - list:
      - listitem:
        - link "Admin":
          - /url: /admin
        - text: /
      - listitem: Organizations
  - navigation:
    - link "Overview":
      - /url: /admin
    - link "Approvals":
      - /url: /admin/approvals
    - link "Organizations":
      - /url: /admin/organizations
    - link "Users":
      - /url: /admin/users
    - link "Roles":
      - /url: /admin/roles
    - link "Tickets":
      - /url: /admin/tickets
    - link "Documents":
      - /url: /admin/documents
    - link "Projects":
      - /url: /admin/projects
    - link "Webhooks":
      - /url: /admin/webhooks
  - heading "Organizations" [level=1]
  - paragraph: View and manage client tenants, domains, status, and service plans.
  - 'link "Acme Manufacturing Slug: acme • Domain: — approved No Plan"':
    - /url: /admin/organizations/11111111-1111-1111-1111-111111111111
    - paragraph: Acme Manufacturing
    - paragraph: "Slug: acme • Domain: —"
    - text: approved No Plan
  - 'link "Northwind Legal Slug: northwind • Domain: — approved No Plan"':
    - /url: /admin/organizations/22222222-2222-2222-2222-222222222222
    - paragraph: Northwind Legal
    - paragraph: "Slug: northwind • Domain: —"
    - text: approved No Plan
- alert
```

# Test source

```ts
  1  | import { test, expect } from "../fixtures";
  2  | 
  3  | test.describe("admin organizations list", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/admin/organizations");
  6  |   });
  7  | 
  8  |   test("renders organizations heading", async ({ page }) => {
  9  |     await expect(page.getByRole("heading", { name: /organizations/i })).toBeVisible();
  10 |   });
  11 | 
  12 |   test("shows organization cards", async ({ page }) => {
  13 |     await expect(page.getByText(/members|organizations/i).first()).toBeVisible();
  14 |   });
  15 | 
  16 |   test("each org card links to detail page", async ({ page }) => {
  17 |     const orgLinks = page.locator("a[href*='/admin/organizations/']");
  18 |     const count = await orgLinks.count();
  19 |     if (count > 0) {
  20 |       const firstLink = orgLinks.first();
  21 |       await expect(firstLink).toBeVisible();
  22 |     }
  23 |   });
  24 | 
  25 |   test("can navigate to org detail", async ({ page }) => {
  26 |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  27 |     if (await orgLink.isVisible()) {
  28 |       await orgLink.click();
  29 |       await expect(page).toHaveURL(/\/admin\/organizations\//);
  30 |     }
  31 |   });
  32 | });
  33 | 
  34 | test.describe("admin organization detail", () => {
  35 |   test("shows not-found for unknown org", async ({ page }) => {
  36 |     await page.goto("/admin/organizations/does-not-exist");
  37 |     await expect(page.getByText(/not found/i)).toBeVisible();
  38 |   });
  39 | 
  40 |   test("shows org basics form when org exists", async ({ page }) => {
  41 |     await page.goto("/admin/organizations");
  42 |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  43 |     if (await orgLink.isVisible()) {
  44 |       await orgLink.click();
  45 |       await expect(page.getByText(/organization basics|name|slug/i).first()).toBeVisible();
  46 |     }
  47 |   });
  48 | 
  49 |   test("shows domains section", async ({ page }) => {
  50 |     await page.goto("/admin/organizations");
  51 |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  52 |     if (await orgLink.isVisible()) {
  53 |       await orgLink.click();
  54 |       await expect(page.getByText(/domains/i).first()).toBeVisible();
  55 |     }
  56 |   });
  57 | 
  58 |   test("shows memberships section", async ({ page }) => {
  59 |     await page.goto("/admin/organizations");
  60 |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  61 |     if (await orgLink.isVisible()) {
  62 |       await orgLink.click();
> 63 |       await expect(page.getByText(/memberships/i).first()).toBeVisible();
     |                                                            ^ Error: expect(locator).toBeVisible() failed
  64 |     }
  65 |   });
  66 | });
  67 | 
```