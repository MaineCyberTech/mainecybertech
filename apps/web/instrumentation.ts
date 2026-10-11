import * as Sentry from "@sentry/nextjs";

export async function register() {
  // OBS-P2-011: the web Sentry configs are a no-op when NEXT_PUBLIC_SENTRY_DSN
  // is unset, and the deploy previously forwarded only SENTRY_DSN (which the
  // web configs never read), so web error tracking was silently dead in
  // production. Warn at boot so the gap shows up in the container logs; the
  // deploy now passes the DSN as a build arg and a web service env var.
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_SENTRY_DSN
  ) {
    console.warn(
      "[sentry] NEXT_PUBLIC_SENTRY_DSN is not set in production - web error tracking is disabled. " +
        "Pass it to the web build (deploy-do.yml build-web) and the web service env (docker-compose.yml).",
    );
  }

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
