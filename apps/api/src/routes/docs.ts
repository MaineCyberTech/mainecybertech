import { Router } from "express";

const router: ReturnType<typeof Router> = Router();

const spec = {
  openapi: "3.0.3",
  info: {
    title: "MCT Client Portal API",
    description:
      "Maine CyberTech Client Portal API. All endpoints require Bearer token authentication unless noted.",
    version: "1.0.0",
    contact: { name: "MCT Support", email: "support@mainecybertech.com" },
  },
  servers: [
    { url: "https://api.mainecybertech.com", description: "Production" },
    { url: "https://api.mainecybertech.us", description: "Dev" },
    { url: "http://localhost:4000", description: "Local development" },
  ],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "Service is healthy" } },
      },
    },

    "/api/v1/docs": {
      get: {
        tags: ["System"],
        summary: "Swagger UI documentation",
        security: [],
        responses: { "200": { description: "Swagger UI HTML" } },
      },
    },
    "/api/v1/openapi.json": {
      get: {
        tags: ["System"],
        summary: "OpenAPI JSON spec",
        security: [],
        responses: { "200": { description: "OpenAPI specification" } },
      },
    },

    "/api/v1/auth/sign-in": {
      post: {
        tags: ["Auth"],
        summary: "Sign in with email/password",
        security: [],
        responses: { "200": { description: "Signed in" } },
      },
    },
    "/api/v1/auth/sign-up": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        security: [],
        responses: { "201": { description: "Account created" } },
      },
    },
    "/api/v1/auth/sign-out": {
      post: {
        tags: ["Auth"],
        summary: "Sign out",
        responses: { "200": { description: "Signed out" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user",
        responses: { "200": { description: "Current user info" } },
      },
    },
    "/api/v1/auth/callback": {
      post: {
        tags: ["Auth"],
        summary: "Exchange PKCE auth code for session cookie",
        security: [],
        responses: { "200": { description: "Session established" } },
      },
    },
    "/api/v1/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Send password reset email",
        security: [],
        responses: { "200": { description: "Reset email sent" } },
      },
    },
    "/api/v1/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using reset token",
        security: [],
        responses: { "200": { description: "Password reset" } },
      },
    },

    "/api/v1/profiles": {
      get: {
        tags: ["Profiles"],
        summary: "List profiles",
        responses: { "200": { description: "List of profiles" } },
      },
    },
    "/api/v1/profiles/{id}": {
      get: {
        tags: ["Profiles"],
        summary: "Get profile",
        responses: { "200": { description: "Profile details" } },
      },
      patch: {
        tags: ["Profiles"],
        summary: "Update profile",
        responses: { "200": { description: "Profile updated" } },
      },
    },
    "/api/v1/profiles/{id}/avatar": {
      post: {
        tags: ["Profiles"],
        summary: "Upload profile avatar",
        responses: { "200": { description: "Avatar uploaded" } },
      },
    },

    "/api/v1/organizations": {
      get: {
        tags: ["Organizations"],
        summary: "List organizations",
        responses: { "200": { description: "List of organizations" } },
      },
      post: {
        tags: ["Organizations"],
        summary: "Create organization (admin)",
        responses: { "201": { description: "Organization created" } },
      },
    },
    "/api/v1/organizations/{id}": {
      get: {
        tags: ["Organizations"],
        summary: "Get organization",
        responses: { "200": { description: "Organization details" } },
      },
      patch: {
        tags: ["Organizations"],
        summary: "Update organization (admin)",
        responses: { "200": { description: "Organization updated" } },
      },
      delete: {
        tags: ["Organizations"],
        summary: "Delete organization (admin)",
        responses: { "204": { description: "Organization deleted" } },
      },
    },
    "/api/v1/organizations/{id}/detail": {
      get: {
        tags: ["Organizations"],
        summary: "Get organization with all related data (compound endpoint)",
        responses: { "200": { description: "Compound organization detail" } },
      },
    },
    "/api/v1/organizations/{id}/logo": {
      post: {
        tags: ["Organizations"],
        summary: "Upload organization logo",
        responses: { "200": { description: "Logo uploaded" } },
      },
    },
    "/api/v1/organizations/{id}/domains": {
      get: {
        tags: ["Organizations"],
        summary: "List organization domains",
        responses: { "200": { description: "List of domains" } },
      },
      post: {
        tags: ["Organizations"],
        summary: "Add organization domain (admin)",
        responses: { "201": { description: "Domain added" } },
      },
    },
    "/api/v1/organizations/{id}/domains/{domainId}": {
      patch: {
        tags: ["Organizations"],
        summary: "Update organization domain (admin)",
        responses: { "200": { description: "Domain updated" } },
      },
      delete: {
        tags: ["Organizations"],
        summary: "Remove organization domain (admin)",
        responses: { "204": { description: "Domain removed" } },
      },
    },

    "/api/v1/memberships": {
      get: {
        tags: ["Memberships"],
        summary: "List memberships",
        responses: { "200": { description: "List of memberships" } },
      },
    },
    "/api/v1/memberships/mine": {
      get: {
        tags: ["Memberships"],
        summary: "Get current user's memberships",
        responses: { "200": { description: "My memberships" } },
      },
    },
    "/api/v1/memberships/invite": {
      post: {
        tags: ["Memberships"],
        summary: "Invite user to organization (admin)",
        responses: { "201": { description: "Invitation sent" } },
      },
    },
    "/api/v1/memberships/{id}": {
      patch: {
        tags: ["Memberships"],
        summary: "Update membership (admin)",
        responses: { "200": { description: "Membership updated" } },
      },
      delete: {
        tags: ["Memberships"],
        summary: "Remove membership (admin)",
        responses: { "204": { description: "Membership removed" } },
      },
    },

    "/api/v1/users": {
      get: {
        tags: ["Users"],
        summary: "List users (admin)",
        responses: { "200": { description: "List of users" } },
      },
    },
    "/api/v1/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user",
        responses: { "200": { description: "User details" } },
      },
    },
    "/api/v1/users/{id}/detail": {
      get: {
        tags: ["Users"],
        summary: "Get user with all related data (compound endpoint)",
        responses: { "200": { description: "Compound user detail" } },
      },
    },
    "/api/v1/users/{id}/role": {
      patch: {
        tags: ["Users"],
        summary: "Update user role (admin)",
        responses: { "200": { description: "Role updated" } },
      },
    },
    "/api/v1/users/{id}/permissions": {
      get: {
        tags: ["Users"],
        summary: "Get user permissions matrix",
        responses: { "200": { description: "Permissions matrix" } },
      },
      put: {
        tags: ["Users"],
        summary: "Toggle user permission override (admin)",
        responses: { "200": { description: "Permission override updated" } },
      },
    },

    "/api/v1/projects/export": {
      get: {
        tags: ["Projects"],
        summary: "Export projects as CSV or JSON",
        responses: { "200": { description: "File download" } },
      },
    },
    "/api/v1/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects",
        responses: { "200": { description: "List of projects" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project",
        responses: { "201": { description: "Project created" } },
      },
    },
    "/api/v1/projects/{id}": {
      get: {
        tags: ["Projects"],
        summary: "Get project",
        responses: { "200": { description: "Project details" } },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update project",
        responses: { "200": { description: "Project updated" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project",
        responses: { "204": { description: "Project deleted" } },
      },
    },
    "/api/v1/projects/{id}/detail": {
      get: {
        tags: ["Projects"],
        summary: "Get project with all related data (compound endpoint)",
        responses: { "200": { description: "Compound project detail" } },
      },
    },
    "/api/v1/projects/{id}/tasks": {
      get: {
        tags: ["Projects"],
        summary: "List project tasks",
        responses: { "200": { description: "List of tasks" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project task",
        responses: { "201": { description: "Task created" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}": {
      patch: {
        tags: ["Projects"],
        summary: "Update project task",
        responses: { "200": { description: "Task updated" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project task",
        responses: { "204": { description: "Task deleted" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}/comments": {
      get: {
        tags: ["Projects"],
        summary: "List task comments",
        responses: { "200": { description: "List of comments" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Add task comment",
        responses: { "201": { description: "Comment added" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}/comments/{commentId}": {
      patch: {
        tags: ["Projects"],
        summary: "Update task comment",
        responses: { "200": { description: "Comment updated" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete task comment",
        responses: { "204": { description: "Comment deleted" } },
      },
    },
    "/api/v1/projects/{id}/tasks/comments": {
      get: {
        tags: ["Projects"],
        summary: "List all task comments for a project",
        responses: { "200": { description: "List of all comments" } },
      },
    },
    "/api/v1/projects/{id}/tasks/read-states": {
      get: {
        tags: ["Projects"],
        summary: "Get task read states",
        responses: { "200": { description: "Read states" } },
      },
    },
    "/api/v1/projects/{id}/tasks/reorder": {
      post: {
        tags: ["Projects"],
        summary: "Reorder tasks",
        responses: { "200": { description: "Tasks reordered" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}/read": {
      post: {
        tags: ["Projects"],
        summary: "Mark task as read",
        responses: { "200": { description: "Task marked read" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}/approve": {
      post: {
        tags: ["Projects"],
        summary: "Approve task",
        responses: { "200": { description: "Task approved" } },
      },
    },
    "/api/v1/projects/{id}/tasks/{taskId}/portal-comment": {
      post: {
        tags: ["Projects"],
        summary: "Add portal-style comment to task",
        responses: { "201": { description: "Portal comment added" } },
      },
    },
    "/api/v1/projects/{id}/updates": {
      get: {
        tags: ["Projects"],
        summary: "List project updates",
        responses: { "200": { description: "List of updates" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project update",
        responses: { "201": { description: "Update created" } },
      },
    },
    "/api/v1/projects/{id}/updates/{updateId}": {
      patch: {
        tags: ["Projects"],
        summary: "Update project update",
        responses: { "200": { description: "Update updated" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project update",
        responses: { "204": { description: "Update deleted" } },
      },
    },

    "/api/v1/tickets/export": {
      get: {
        tags: ["Tickets"],
        summary: "Export tickets as CSV or JSON",
        responses: { "200": { description: "File download" } },
      },
    },
    "/api/v1/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List tickets",
        responses: { "200": { description: "List of tickets" } },
      },
      post: {
        tags: ["Tickets"],
        summary: "Create ticket",
        responses: { "201": { description: "Ticket created" } },
      },
    },
    "/api/v1/tickets/{id}": {
      get: {
        tags: ["Tickets"],
        summary: "Get ticket",
        responses: { "200": { description: "Ticket details" } },
      },
      patch: {
        tags: ["Tickets"],
        summary: "Update ticket",
        responses: { "200": { description: "Ticket updated" } },
      },
    },
    "/api/v1/tickets/{id}/comments": {
      get: {
        tags: ["Tickets"],
        summary: "List ticket comments",
        responses: { "200": { description: "List of comments" } },
      },
      post: {
        tags: ["Tickets"],
        summary: "Add ticket comment",
        responses: { "201": { description: "Comment added" } },
      },
    },
    "/api/v1/tickets/{id}/comments/{commentId}": {
      patch: {
        tags: ["Tickets"],
        summary: "Edit ticket comment (5-min window)",
        responses: { "200": { description: "Comment updated" } },
      },
    },

    "/api/v1/documents": {
      get: {
        tags: ["Documents"],
        summary: "List documents",
        responses: { "200": { description: "List of documents" } },
      },
      post: {
        tags: ["Documents"],
        summary: "Create document metadata",
        responses: { "201": { description: "Document created" } },
      },
    },
    "/api/v1/documents/upload": {
      post: {
        tags: ["Documents"],
        summary: "Upload document file",
        responses: { "201": { description: "Document uploaded" } },
      },
    },
    "/api/v1/documents/{id}": {
      get: {
        tags: ["Documents"],
        summary: "Get document",
        responses: { "200": { description: "Document details" } },
      },
      patch: {
        tags: ["Documents"],
        summary: "Update document",
        responses: { "200": { description: "Document updated" } },
      },
      delete: {
        tags: ["Documents"],
        summary: "Delete document",
        responses: { "204": { description: "Document deleted" } },
      },
    },
    "/api/v1/documents/{id}/signed-url": {
      post: {
        tags: ["Documents"],
        summary: "Get signed download URL",
        responses: { "200": { description: "Signed URL" } },
      },
    },
    "/api/v1/documents/{id}/versions": {
      get: {
        tags: ["Documents"],
        summary: "List document versions",
        responses: { "200": { description: "List of versions" } },
      },
    },
    "/api/v1/documents/{id}/versions/{versionId}": {
      get: {
        tags: ["Documents"],
        summary: "Get specific document version",
        responses: { "200": { description: "Version details" } },
      },
    },
    "/api/v1/documents/bulk/folder": {
      post: {
        tags: ["Documents"],
        summary: "Bulk move documents to folder",
        responses: { "200": { description: "Documents moved" } },
      },
    },
    "/api/v1/documents/bulk/metadata": {
      post: {
        tags: ["Documents"],
        summary: "Bulk update document metadata",
        responses: { "200": { description: "Metadata updated" } },
      },
    },

    "/api/v1/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard summary counts",
        responses: { "200": { description: "Dashboard summary" } },
      },
    },

    "/api/v1/roles": {
      get: {
        tags: ["Roles"],
        summary: "List roles",
        responses: { "200": { description: "List of roles" } },
      },
    },
    "/api/v1/roles/{id}": {
      get: {
        tags: ["Roles"],
        summary: "Get role",
        responses: { "200": { description: "Role details" } },
      },
    },
    "/api/v1/roles/{id}/permissions": {
      get: {
        tags: ["Roles"],
        summary: "Get role permission mappings",
        responses: { "200": { description: "Role permissions" } },
      },
      put: {
        tags: ["Roles"],
        summary: "Update role permission mappings (admin)",
        responses: { "200": { description: "Role permissions updated" } },
      },
    },

    "/api/v1/audit": {
      get: {
        tags: ["Audit"],
        summary: "List audit logs (admin)",
        responses: { "200": { description: "List of audit logs" } },
      },
    },
    "/api/v1/audit/export": {
      get: {
        tags: ["Audit"],
        summary: "Export audit logs as CSV/JSON (admin)",
        responses: { "200": { description: "Audit export" } },
      },
    },

    "/api/v1/search": {
      get: {
        tags: ["Search"],
        summary: "Global admin search",
        responses: { "200": { description: "Search results" } },
      },
    },
    "/api/v1/search/portal": {
      get: {
        tags: ["Search"],
        summary: "Portal-scoped search",
        responses: { "200": { description: "Search results" } },
      },
    },

    "/api/v1/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications",
        responses: { "200": { description: "List of notifications" } },
      },
      post: {
        tags: ["Notifications"],
        summary: "Create notification (admin)",
        responses: { "201": { description: "Notification created" } },
      },
    },
    "/api/v1/notifications/unread-count": {
      get: {
        tags: ["Notifications"],
        summary: "Get unread notification count",
        responses: { "200": { description: "Unread count" } },
      },
    },
    "/api/v1/notifications/{id}/read": {
      post: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        responses: { "200": { description: "Marked read" } },
      },
    },
    "/api/v1/notifications/mark-all-read": {
      post: {
        tags: ["Notifications"],
        summary: "Mark all notifications as read",
        responses: { "200": { description: "All marked read" } },
      },
    },
    "/api/v1/notifications/{id}": {
      delete: {
        tags: ["Notifications"],
        summary: "Delete notification",
        responses: { "204": { description: "Notification deleted" } },
      },
    },

    "/api/v1/notification-preferences": {
      get: {
        tags: ["Notifications"],
        summary: "Get notification preferences",
        responses: { "200": { description: "Notification preferences" } },
      },
      put: {
        tags: ["Notifications"],
        summary: "Update notification preferences",
        responses: { "200": { description: "Preferences updated" } },
      },
    },

    "/api/v1/billing/summary": {
      get: {
        tags: ["Billing"],
        summary: "Get billing summary",
        responses: { "200": { description: "Billing summary" } },
      },
    },
    "/api/v1/billing/invoices": {
      get: {
        tags: ["Billing"],
        summary: "List invoices",
        responses: { "200": { description: "List of invoices" } },
      },
    },
    "/api/v1/billing/invoices/{id}": {
      get: {
        tags: ["Billing"],
        summary: "Get invoice details",
        responses: { "200": { description: "Invoice details" } },
      },
    },
    "/api/v1/billing/subscriptions": {
      get: {
        tags: ["Billing"],
        summary: "List subscriptions",
        responses: { "200": { description: "List of subscriptions" } },
      },
    },
    "/api/v1/billing/payments": {
      get: {
        tags: ["Billing"],
        summary: "List payments",
        responses: { "200": { description: "List of payments" } },
      },
    },
    "/api/v1/billing/billing-customer": {
      get: {
        tags: ["Billing"],
        summary: "Get billing customer info",
        responses: { "200": { description: "Customer info" } },
      },
    },
    "/api/v1/billing/sync": {
      post: {
        tags: ["Billing"],
        summary: "Trigger Stripe sync (admin)",
        responses: { "200": { description: "Sync triggered" } },
      },
    },

    "/api/v1/webhooks/stripe": {
      post: {
        tags: ["Webhooks"],
        summary: "Stripe webhook receiver",
        security: [],
        responses: { "200": { description: "Webhook processed" } },
      },
    },
    "/api/v1/webhooks/jira": {
      post: {
        tags: ["Webhooks"],
        summary: "Jira webhook receiver",
        security: [],
        responses: { "200": { description: "Webhook processed" } },
      },
    },
    "/api/v1/webhooks/jsm": {
      post: {
        tags: ["Webhooks"],
        summary: "JSM webhook receiver",
        security: [],
        responses: { "200": { description: "Webhook processed" } },
      },
    },
    "/api/v1/webhooks/m365": {
      post: {
        tags: ["Webhooks"],
        summary: "M365 webhook receiver",
        security: [],
        responses: { "200": { description: "Webhook processed" } },
      },
    },

    "/api/v1/webhook-endpoints": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhook endpoints",
        responses: { "200": { description: "List of webhook endpoints" } },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook endpoint (admin)",
        responses: { "201": { description: "Webhook endpoint created" } },
      },
    },
    "/api/v1/webhook-endpoints/{id}": {
      get: {
        tags: ["Webhooks"],
        summary: "Get webhook endpoint",
        responses: { "200": { description: "Webhook endpoint details" } },
      },
      patch: {
        tags: ["Webhooks"],
        summary: "Update webhook endpoint (admin)",
        responses: { "200": { description: "Webhook endpoint updated" } },
      },
      delete: {
        tags: ["Webhooks"],
        summary: "Delete webhook endpoint (admin)",
        responses: { "204": { description: "Webhook endpoint deleted" } },
      },
    },
    "/api/v1/webhook-endpoints/{id}/deliveries": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhook delivery attempts",
        responses: { "200": { description: "List of deliveries" } },
      },
    },
    "/api/v1/webhook-endpoints/{id}/test": {
      post: {
        tags: ["Webhooks"],
        summary: "Test webhook endpoint (admin)",
        responses: { "200": { description: "Test sent" } },
      },
    },

    "/api/v1/bulk/invite": {
      post: {
        tags: ["Bulk"],
        summary: "Bulk invite users via CSV (admin)",
        responses: { "200": { description: "Bulk invite processed" } },
      },
    },

    "/api/v1/public/init": {
      get: {
        tags: ["Public"],
        summary: "Get public site initialization data",
        security: [],
        responses: { "200": { description: "Public init data" } },
      },
    },
    "/api/v1/public/submit": {
      post: {
        tags: ["Public"],
        summary: "Submit public contact form / lead",
        security: [],
        responses: { "200": { description: "Form submitted" } },
      },
    },
  },
};

router.get("/openapi.json", (_req, res) => {
  res.json(spec);
});

router.get("/docs", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MCT API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "/api/v1/openapi.json",
      dom_id: "#swagger-ui",
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout",
    });
  </script>
</body>
</html>`);
});

export default router;
