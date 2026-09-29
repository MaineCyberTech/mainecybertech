import * as Sentry from "@sentry/node";
import { getEnv } from "../config/env";

export function initSentry() {
  const env = getEnv();
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.SENTRY_RELEASE ?? process.env.GIT_SHA,
    tracesSampleRate: env.SENTRY_TRACES_SAMPLE_RATE ?? (env.NODE_ENV === "production" ? 0.2 : 0.0),
  });
}
