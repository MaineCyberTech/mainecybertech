import { Router } from "express";

const router: ReturnType<typeof Router> = Router();

const spec = {
  openapi: "3.0.3",
  info: {
    title: "MCT Client Portal API",
    description: "Maine CyberTech Client Portal API. All endpoints require Bearer token authentication unless noted.",
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
    "/health": { get: { tags: ["System"], summary: "Health check", security: [], responses: { "200": { description: "Service is healthy" } } } },
    "/api/v1/auth/sign-in": { post: { tags: ["Auth"], summary: "Sign in with email/password", security: [], responses: { "200": { description: "Signed in" } } } },
    "/api/v1/auth/sign-up": { post: { tags: ["Auth"], summary: "Register a new account", security: [], responses: { "201": { description: "Account created" } } } },
    "/api/v1/auth/sign-out": { post: { tags: ["Auth"], summary: "Sign out", responses: { "200": { description: "Signed out" } } } },
    "/api/v1/auth/me": { get: { tags: ["Auth"], summary: "Get current user", responses: { "200": { description: "Current user info" } } } },
    "/api/v1/organizations": {
      get: { tags: ["Organizations"], summary: "List organizations", responses: { "200": { description: "List of organizations" } } },
      post: { tags: ["Organizations"], summary: "Create organization (admin)", responses: { "201": { description: "Organization created" } } },
    },
    "/api/v1/organizations/{id}": {
      get: { tags: ["Organizations"], summary: "Get organization", responses: { "200": { description: "Organization details" } } },
      patch: { tags: ["Organizations"], summary: "Update organization (admin)", responses: { "200": { description: "Organization updated" } } },
      delete: { tags: ["Organizations"], summary: "Delete organization (admin)", responses: { "204": { description: "Organization deleted" } } },
    },
    "/api/v1/organizations/{id}/detail": { get: { tags: ["Organizations"], summary: "Get organization with all related data (compound endpoint)", responses: { "200": { description: "Compound organization detail" } } } },
    "/api/v1/projects": {
      get: { tags: ["Projects"], summary: "List projects", responses: { "200": { description: "List of projects" } } },
      post: { tags: ["Projects"], summary: "Create project", responses: { "201": { description: "Project created" } } },
    },
    "/api/v1/projects/{id}": {
      get: { tags: ["Projects"], summary: "Get project", responses: { "200": { description: "Project details" } } },
      patch: { tags: ["Projects"], summary: "Update project", responses: { "200": { description: "Project updated" } } },
      delete: { tags: ["Projects"], summary: "Delete project", responses: { "204": { description: "Project deleted" } } },
    },
    "/api/v1/projects/{id}/detail": { get: { tags: ["Projects"], summary: "Get project with all related data (compound endpoint)", responses: { "200": { description: "Compound project detail" } } } },
    "/api/v1/tickets": {
      get: { tags: ["Tickets"], summary: "List tickets", responses: { "200": { description: "List of tickets" } } },
      post: { tags: ["Tickets"], summary: "Create ticket", responses: { "201": { description: "Ticket created" } } },
    },
    "/api/v1/documents": {
      get: { tags: ["Documents"], summary: "List documents", responses: { "200": { description: "List of documents" } } },
      post: { tags: ["Documents"], summary: "Create document", responses: { "201": { description: "Document created" } } },
    },
    "/api/v1/users": { get: { tags: ["Users"], summary: "List users (admin)", responses: { "200": { description: "List of users" } } } },
    "/api/v1/users/{id}": { get: { tags: ["Users"], summary: "Get user", responses: { "200": { description: "User details" } } } },
    "/api/v1/users/{id}/detail": { get: { tags: ["Users"], summary: "Get user with all related data (compound endpoint)", responses: { "200": { description: "Compound user detail" } } } },
    "/api/v1/memberships": { get: { tags: ["Memberships"], summary: "List memberships", responses: { "200": { description: "List of memberships" } } } },
    "/api/v1/dashboard/summary": { get: { tags: ["Dashboard"], summary: "Get dashboard summary counts", responses: { "200": { description: "Dashboard summary" } } } },
    "/api/v1/roles": { get: { tags: ["Roles"], summary: "List roles", responses: { "200": { description: "List of roles" } } } },
    "/api/v1/audit": { get: { tags: ["Audit"], summary: "List audit logs", responses: { "200": { description: "List of audit logs" } } } },
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
