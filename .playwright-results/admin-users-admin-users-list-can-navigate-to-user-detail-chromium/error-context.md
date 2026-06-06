# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\users.spec.ts >> admin users list >> can navigate to user detail
- Location: e2e\admin\users.spec.ts:25:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin\/users\//
Received string:  "http://localhost:3000/admin/users"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × unexpected value "http://localhost:3000/admin/users"

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
      - listitem: Users
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
  - heading "Users" [level=1]
  - paragraph: Manage user profiles, organization memberships, and role assignments.
  - text: "Total memberships: 9"
  - 'link "Julian Super Admin superadmin.real@mainecybertech.local Org: Northwind Legal • Role: Super Admin • Status: approved Super Admin Billing Contact Security Contact"':
    - /url: /admin/users/66ce903f-6fe0-45da-878b-a0398e6b1981
    - paragraph: Julian Super Admin
    - paragraph: superadmin.real@mainecybertech.local
    - paragraph: "Org: Northwind Legal • Role: Super Admin • Status: approved"
    - text: Super Admin Billing Contact Security Contact
  - 'link "Julian Super Admin superadmin.real@mainecybertech.local Org: Acme Manufacturing • Role: Super Admin • Status: approved Super Admin Billing Contact Security Contact"':
    - /url: /admin/users/66ce903f-6fe0-45da-878b-a0398e6b1981
    - paragraph: Julian Super Admin
    - paragraph: superadmin.real@mainecybertech.local
    - paragraph: "Org: Acme Manufacturing • Role: Super Admin • Status: approved"
    - text: Super Admin Billing Contact Security Contact
  - 'link "Morgan MSP Admin mspadmin.real@mainecybertech.local Org: Northwind Legal • Role: Admin • Status: approved Billing Contact Security Contact"':
    - /url: /admin/users/817016dc-cc3b-49d1-8ee6-637f880fa0a4
    - paragraph: Morgan MSP Admin
    - paragraph: mspadmin.real@mainecybertech.local
    - paragraph: "Org: Northwind Legal • Role: Admin • Status: approved"
    - text: Billing Contact Security Contact
  - 'link "Morgan MSP Admin mspadmin.real@mainecybertech.local Org: Acme Manufacturing • Role: Admin • Status: approved Billing Contact Security Contact"':
    - /url: /admin/users/817016dc-cc3b-49d1-8ee6-637f880fa0a4
    - paragraph: Morgan MSP Admin
    - paragraph: mspadmin.real@mainecybertech.local
    - paragraph: "Org: Acme Manufacturing • Role: Admin • Status: approved"
    - text: Billing Contact Security Contact
  - 'link "Blake Client Admin clientadmin.real@beta.example Org: Northwind Legal • Role: Client Admin • Status: approved Billing Contact Security Contact"':
    - /url: /admin/users/ebc615c1-6c95-46a6-9bf1-68a4af87b1d8
    - paragraph: Blake Client Admin
    - paragraph: clientadmin.real@beta.example
    - paragraph: "Org: Northwind Legal • Role: Client Admin • Status: approved"
    - text: Billing Contact Security Contact
  - 'link "Avery Client Admin clientadmin.real@acme.example Org: Acme Manufacturing • Role: Client Admin • Status: approved Billing Contact Security Contact"':
    - /url: /admin/users/ef0370d6-0da8-43a1-8f24-d8c4f19448a0
    - paragraph: Avery Client Admin
    - paragraph: clientadmin.real@acme.example
    - paragraph: "Org: Acme Manufacturing • Role: Client Admin • Status: approved"
    - text: Billing Contact Security Contact
  - 'link "Taylor Technician technician.real@acme.example Org: Acme Manufacturing • Role: Technician • Status: approved Security Contact"':
    - /url: /admin/users/b0a65dea-16c7-4f54-8192-d9267a4219d1
    - paragraph: Taylor Technician
    - paragraph: technician.real@acme.example
    - paragraph: "Org: Acme Manufacturing • Role: Technician • Status: approved"
    - text: Security Contact
  - 'link "Jordan Client User user.real@beta.example Org: Northwind Legal • Role: Client User • Status: approved"':
    - /url: /admin/users/6adfefa6-27c2-480e-9881-6514f4e9b708
    - paragraph: Jordan Client User
    - paragraph: user.real@beta.example
    - paragraph: "Org: Northwind Legal • Role: Client User • Status: approved"
  - 'link "Casey Client User user.real@acme.example Org: Acme Manufacturing • Role: Client User • Status: approved"':
    - /url: /admin/users/71d23f2a-39b9-42f7-9ddc-115ac45ef12e
    - paragraph: Casey Client User
    - paragraph: user.real@acme.example
    - paragraph: "Org: Acme Manufacturing • Role: Client User • Status: approved"
- alert
```

# Test source

```ts
  1  | import { test, expect } from "../fixtures";
  2  | 
  3  | test.describe("admin users list", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/admin/users");
  6  |   });
  7  | 
  8  |   test("renders users heading", async ({ page }) => {
  9  |     await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  10 |   });
  11 | 
  12 |   test("shows user count or list", async ({ page }) => {
  13 |     await expect(page.getByText(/members|users/i).first()).toBeVisible();
  14 |   });
  15 | 
  16 |   test("each user card has name and email", async ({ page }) => {
  17 |     const userCards = page.locator("a[href*='/admin/users/']");
  18 |     const count = await userCards.count();
  19 |     if (count > 0) {
  20 |       const firstCard = userCards.first();
  21 |       await expect(firstCard).toBeVisible();
  22 |     }
  23 |   });
  24 | 
  25 |   test("can navigate to user detail", async ({ page }) => {
  26 |     const userLink = page.locator("a[href*='/admin/users/']").first();
  27 |     if (await userLink.isVisible()) {
  28 |       await userLink.click();
> 29 |       await expect(page).toHaveURL(/\/admin\/users\//);
     |                          ^ Error: expect(page).toHaveURL(expected) failed
  30 |       await expect(page.getByRole("heading")).toBeVisible();
  31 |     }
  32 |   });
  33 | });
  34 | 
  35 | test.describe("admin user detail", () => {
  36 |   test("shows not-found for unknown user", async ({ page }) => {
  37 |     await page.goto("/admin/users/does-not-exist");
  38 |     await expect(page.getByText(/not found/i)).toBeVisible();
  39 |   });
  40 | 
  41 |   test("navigates back to users list", async ({ page }) => {
  42 |     await page.goto("/admin/users");
  43 |     const userLink = page.locator("a[href*='/admin/users/']").first();
  44 |     if (await userLink.isVisible()) {
  45 |       await userLink.click();
  46 |       const backLink = page.getByRole("link", { name: /back|users/i });
  47 |       if (await backLink.isVisible()) {
  48 |         await backLink.click();
  49 |         await expect(page).toHaveURL(/\/admin\/users$/);
  50 |       }
  51 |     }
  52 |   });
  53 | });
  54 | 
```