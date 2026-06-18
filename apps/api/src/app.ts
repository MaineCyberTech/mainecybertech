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
import adminRouter from "./routes/admin";
import bulkRouter from "./routes/bulk";
import { initSentry } from "./lib/sentry";

export function createApp(): Express {
  initSentry();

  const env = getEnv();
  const app = express();
  app.set("trust proxy", true);

  app.use(helmet());
  const allowedOrigins =
    env.CORS_ORIGIN === "*"
      ? "*"
      : env.CORS_ORIGIN.split(",").map((s) => s.trim());
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
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      req.path === "/health" || req.ip === "127.0.0.1" || req.ip === "::1",
  });

  app.use(limiter);
  app.use(rateLimitByUser);
  app.use(requestId);
  app.use(requestLogger);

  app.use("/health", healthRouter);
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
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/bulk", bulkRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
