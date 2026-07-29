import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env";
import { errorHandler } from "./middleware/error";
import { notFoundHandler } from "./middleware/not-found";
import { requestId, requestLogger } from "./middleware/request-id";
import { rateLimitByUser } from "./middleware/rate-limit";
import { inputSanitizer } from "./middleware/security";
import { securityHeaders } from "./middleware/security-headers";
import { csrfProtection } from "./middleware/csrf";
import { idempotencyMiddleware } from "./middleware/idempotency";
import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import organizationsRouter from "./routes/organizations";
import membershipsRouter from "./routes/memberships";
import usersRouter from "./routes/users";
import profilesRouter from "./routes/profiles";
import ticketsRouter from "./routes/tickets";
import projectsRouter from "./routes/projects";
import documentsRouter from "./routes/documents";
import dashboardRouter from "./routes/dashboard";
import auditRouter from "./routes/audit";
import webhooksRouter from "./routes/webhooks";
import rolesRouter from "./routes/roles";
import searchRouter from "./routes/search";
import searchPortalRouter from "./routes/search-portal";
import docsRouter from "./routes/docs";
import publicRouter from "./routes/public";
import notificationsRouter from "./routes/notifications";
import notificationPreferencesRouter from "./routes/notification-preferences";
import billingRouter from "./routes/billing";
import webhookManagementRouter from "./routes/webhook-management";
import slaRouter from "./routes/sla";
import apiKeysRouter from "./routes/api-keys";
import adminRouter from "./routes/admin";
import bulkRouter from "./routes/bulk";
import approvalsRouter from "./routes/approvals";
import businessOsRouter from "./routes/business-os";
import proposalsRouter from "./routes/proposals";
import findingsRouter from "./routes/findings";
import assetsRouter from "./routes/assets";
import domainMonitorsRouter from "./routes/domain-monitors";
import qbrRouter from "./routes/qbr";
import fileRequestsRouter from "./routes/file-requests";
import aiRouter from "./routes/ai";
import vendorsRouter from "./routes/vendors";
import serviceCatalogRouter from "./routes/service-catalog";
import batchRouter from "./routes/batch";
import securityOpsRouter from "./routes/security-ops";
import securitySuiteRouter from "./routes/security-suite";
import governanceRouter from "./routes/governance";
import fieldServicesRouter from "./routes/field-services";
import eduAutomationRouter from "./routes/edu-automation";
import finalRouter from "./routes/final";
import clientOnboardingRouter from "./routes/client-onboarding-command-center";
import satisfactionPulseWidgetRouter from "./routes/satisfaction-pulse-widget";
import dynamicClientFormsBuilderRouter from "./routes/dynamic-client-forms-builder";
import licenseOptimizerRouter from "./routes/license-optimizer";
import dmarcCoachRouter from "./routes/dmarc-coach";
import trainingHubRouter from "./routes/training-hub";
import insuranceBinderRouter from "./routes/insurance-binder";
import statusPageRouter from "./routes/status-page";
import uptimeMonitorRouter from "./routes/uptime-monitor";
import { initSentry } from "./lib/sentry";
import { register } from "./lib/metrics";

export function createApp(): Express {
  initSentry();

  const env = getEnv();
  const app = express();
  app.set("trust proxy", true);

  app.use(helmet());
  const allowedOrigins =
    env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((s) => s.trim());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(
    express.json({
      limit: "10mb",
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      },
    }),
  );
  app.use(cookieParser());
  app.use(securityHeaders);
  app.use(inputSanitizer);

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: JSON.stringify({
      success: false,
      error: {
        code: "RATE_LIMIT",
        message: "Too many requests from this IP, please try again later.",
        status: 429,
      },
    }),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.path === "/health" ||
      req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.path.startsWith("/api/v1/webhooks/"),
  });

  app.use(limiter);
  app.use(rateLimitByUser);
  app.use(requestId);
  app.use(requestLogger);
  app.use(idempotencyMiddleware);
  app.use(csrfProtection);

  app.use("/health", healthRouter);
  app.use("/metrics", async (_req, res) => {
    try {
      res.set("Content-Type", register.contentType);
      res.end(await register.metrics());
    } catch (ex) {
      res.status(500).end(ex instanceof Error ? ex.message : String(ex));
    }
  });
  app.use("/api/v1", docsRouter);

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/organizations", organizationsRouter);
  app.use("/api/v1/memberships", membershipsRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/profiles", profilesRouter);
  app.use("/api/v1/tickets", ticketsRouter);
  app.use("/api/v1/projects", projectsRouter);
  app.use("/api/v1/documents", documentsRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/audit", auditRouter);
  app.use("/api/v1/webhooks", webhooksRouter);
  app.use("/api/v1/roles", rolesRouter);
  app.use("/api/v1/search", searchRouter);
  app.use("/api/v1/search/portal", searchPortalRouter);
  app.use("/api/v1/public", publicRouter);
  app.use("/api/v1/notifications", notificationsRouter);
  app.use("/api/v1/notification-preferences", notificationPreferencesRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/webhook-endpoints", webhookManagementRouter);
  app.use("/api/v1/sla", slaRouter);
  app.use("/api/v1/api-keys", apiKeysRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/bulk", bulkRouter);
  app.use("/api/v1/approvals", approvalsRouter);
  app.use("/api/v1/business-os", businessOsRouter);
  app.use("/api/v1/proposals", proposalsRouter);
  app.use("/api/v1/findings", findingsRouter);
  app.use("/api/v1/assets", assetsRouter);
  app.use("/api/v1/domain-monitors", domainMonitorsRouter);
  app.use("/api/v1/qbr", qbrRouter);
  app.use("/api/v1/file-requests", fileRequestsRouter);
  app.use("/api/v1/ai", aiRouter);
  app.use("/api/v1/vendors", vendorsRouter);
  app.use("/api/v1/service-catalog", serviceCatalogRouter);
  app.use("/api/v1/batch", batchRouter);
  app.use("/api/v1/security-ops", securityOpsRouter);
  app.use("/api/v1/security-suite", securitySuiteRouter);
  app.use("/api/v1/governance", governanceRouter);
  app.use("/api/v1/field-services", fieldServicesRouter);
  app.use("/api/v1/edu-automation", eduAutomationRouter);
  app.use("/api/v1/final", finalRouter);
  app.use("/api/v1/client-onboarding", clientOnboardingRouter);
  app.use("/api/v1/satisfaction-pulse", satisfactionPulseWidgetRouter);
  app.use("/api/v1/dynamic-forms", dynamicClientFormsBuilderRouter);
  app.use("/api/v1/license-optimizer", licenseOptimizerRouter);
  app.use("/api/v1/dmarc-coach", dmarcCoachRouter);
  app.use("/api/v1/training-hub", trainingHubRouter);
  app.use("/api/v1/insurance-binder", insuranceBinderRouter);
  app.use("/api/v1/status-page", statusPageRouter);
  app.use("/api/v1/uptime-monitor", uptimeMonitorRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
