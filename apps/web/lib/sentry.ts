import * as Sentry from "@sentry/browser";

export function initBrowserSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 0.0,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [],
  });
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  try {
    Sentry.captureException(error, { extra: context });
  } catch {}
}
