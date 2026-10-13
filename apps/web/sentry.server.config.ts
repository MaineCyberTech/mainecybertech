import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "./lib/sentry-scrub";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

function resolveTracesSampleRate(raw: string | undefined): number {
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  return process.env.NODE_ENV === "production" ? 0.2 : 0.0;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE ?? process.env.NEXT_PUBLIC_GIT_SHA,
    tracesSampleRate: resolveTracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
    // AN-P3-004: never attach default PII and scrub every event before
    // transport — see lib/sentry-scrub.ts.
    sendDefaultPii: false,
    beforeSend: (event) => scrubSentryEvent(event),
  });
}
