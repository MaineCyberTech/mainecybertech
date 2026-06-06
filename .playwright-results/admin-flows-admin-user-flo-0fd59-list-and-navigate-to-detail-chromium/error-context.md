# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin\flows.spec.ts >> admin user flows >> can view user list and navigate to detail
- Location: e2e\admin\flows.spec.ts:22:7

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
  1   | import { test, expect } from "../fixtures";
  2   | 
  3   | test.describe("admin ticket flows", () => {
  4   |   test("can view ticket list and navigate to detail", async ({ page }) => {
  5   |     await page.goto("/admin/tickets");
  6   |     await expect(page.getByRole("heading", { name: "Tickets", exact: true })).toBeVisible();
  7   | 
  8   |     const ticketLink = page.locator("a[href*='/admin/tickets/']").first();
  9   |     if (await ticketLink.isVisible()) {
  10  |       await ticketLink.click();
  11  |       await expect(page).toHaveURL(/\/admin\/tickets\//);
  12  |     }
  13  |   });
  14  | 
  15  |   test("shows not-found for unknown ticket", async ({ page }) => {
  16  |     await page.goto("/admin/tickets/does-not-exist");
  17  |     await expect(page.getByText(/not found/i)).toBeVisible();
  18  |   });
  19  | });
  20  | 
  21  | test.describe("admin user flows", () => {
  22  |   test("can view user list and navigate to detail", async ({ page }) => {
  23  |     await page.goto("/admin/users");
  24  |     await expect(page.getByRole("heading", { name: /users/i })).toBeVisible();
  25  | 
  26  |     const userLink = page.locator("a[href*='/admin/users/']").first();
  27  |     if (await userLink.isVisible()) {
  28  |       await userLink.click();
> 29  |       await expect(page).toHaveURL(/\/admin\/users\//);
      |                          ^ Error: expect(page).toHaveURL(expected) failed
  30  |     }
  31  |   });
  32  | 
  33  |   test("shows not-found for unknown user", async ({ page }) => {
  34  |     await page.goto("/admin/users/does-not-exist");
  35  |     await expect(page.getByText(/not found/i)).toBeVisible();
  36  |   });
  37  | });
  38  | 
  39  | test.describe("admin organization flows", () => {
  40  |   test("can view org list and navigate to detail", async ({ page }) => {
  41  |     await page.goto("/admin/organizations");
  42  |     await expect(page.getByRole("heading", { name: /organizations/i })).toBeVisible();
  43  | 
  44  |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  45  |     if (await orgLink.isVisible()) {
  46  |       await orgLink.click();
  47  |       await expect(page).toHaveURL(/\/admin\/organizations\//);
  48  |     }
  49  |   });
  50  | 
  51  |   test("org detail shows basics form", async ({ page }) => {
  52  |     await page.goto("/admin/organizations");
  53  |     const orgLink = page.locator("a[href*='/admin/organizations/']").first();
  54  |     if (await orgLink.isVisible()) {
  55  |       await orgLink.click();
  56  |       await expect(page.getByText(/organization basics|name/i).first()).toBeVisible();
  57  |       await expect(page.getByText(/domains/i).first()).toBeVisible();
  58  |       await expect(page.getByText(/memberships/i).first()).toBeVisible();
  59  |     }
  60  |   });
  61  | });
  62  | 
  63  | test.describe("admin project flows", () => {
  64  |   test("can view project list and navigate to detail", async ({ page }) => {
  65  |     await page.goto("/admin/projects");
  66  |     await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
  67  | 
  68  |     const projectLink = page.locator("a[href*='/admin/projects/']").first();
  69  |     if (await projectLink.isVisible()) {
  70  |       await projectLink.click();
  71  |       await expect(page.getByText(/project/i).first()).toBeVisible();
  72  |     }
  73  |   });
  74  | 
  75  |   test("project detail shows task list section", async ({ page }) => {
  76  |     await page.goto("/admin/projects");
  77  |     const projectLink = page.locator("a[href*='/admin/projects/']").first();
  78  |     if (await projectLink.isVisible()) {
  79  |       await projectLink.click();
  80  |       await expect(page.getByText(/task/i).first()).toBeVisible();
  81  |     }
  82  |   });
  83  | });
  84  | 
  85  | test.describe("admin document flows", () => {
  86  |   test("can view document list", async ({ page }) => {
  87  |     await page.goto("/admin/documents");
  88  |     await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  89  |   });
  90  | 
  91  |   test("has view mode toggles", async ({ page }) => {
  92  |     await page.goto("/admin/documents");
  93  |     await expect(page.getByRole("button", { name: /list/i })).toBeVisible();
  94  |   });
  95  | });
  96  | 
  97  | test.describe("portal flows", () => {
  98  |   test("portal dashboard loads with org name", async ({ page }) => {
  99  |     await page.goto("/portal/dashboard");
  100 |     await expect(page.getByText(/organization|company/i).first()).toBeVisible();
  101 |   });
  102 | 
  103 |   test("portal has navigation links", async ({ page }) => {
  104 |     await page.goto("/portal/dashboard");
  105 |     await expect(page.getByRole("link", { name: /documents/i })).toBeVisible();
  106 |     await expect(page.getByRole("link", { name: "Support", exact: true })).toBeVisible();
  107 |   });
  108 | 
  109 |   test("portal documents page loads", async ({ page }) => {
  110 |     await page.goto("/portal/documents");
  111 |     await expect(page.getByRole("heading", { name: /documents/i })).toBeVisible();
  112 |   });
  113 | 
  114 |   test("portal support page loads", async ({ page }) => {
  115 |     await page.goto("/portal/support");
  116 |     await expect(page.getByRole("heading", { name: "Support", exact: true })).toBeVisible();
  117 |   });
  118 | });
  119 | 
  120 | test.describe("cross-navigation flows", () => {
  121 |   test("can navigate between admin sections", async ({ page }) => {
  122 |     await page.goto("/admin");
  123 |     await expect(page.getByRole("link", { name: "Users", exact: true })).toBeVisible();
  124 |     await expect(page.getByRole("link", { name: "Organizations", exact: true })).toBeVisible();
  125 |     await expect(page.getByRole("link", { name: "Projects", exact: true })).toBeVisible();
  126 |     await expect(page.getByRole("link", { name: "Tickets", exact: true })).toBeVisible();
  127 |   });
  128 | 
  129 |   test("can navigate from user detail back to users list", async ({ page }) => {
```