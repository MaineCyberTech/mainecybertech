/**
 * Shared environment-schema source of truth (EVOL-P3-005).
 *
 * The API and worker env modules (`apps/api/src/config/env.ts`,
 * `apps/worker/src/env.ts`) used to duplicate the same field definitions and
 * the same `resolveRedisUrl` helper. This module owns the shared pieces; each
 * app composes them into its own `z.object` and keeps app-specific keys local.
 *
 * Consumers: `@mct/config/env` (see package.json exports). The SDK subpath
 * mapping precedent applies — jest maps this to source in the app configs so
 * ts-jest compiles it without a build step.
 */
import { z } from "zod";

/** `NODE_ENV` shared by every server process. */
export const nodeEnvSchema = z.enum(["development", "production", "test"]).default("development");

/** Pino log level shared by the API and worker. */
export const logLevelSchema = z.enum(["debug", "info", "warn", "error", "silent"]).default("info");

/** Supabase connection keys required by both the API and the worker. */
export const supabaseEnvShape = {
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
} as const;

/** Redis/queue knobs shared by the API producer and the worker consumer. */
export const redisEnvShape = {
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),
  TASK_QUEUE_ENABLED: z.enum(["true", "false"]).optional(),
} as const;

/**
 * Queue backend enum. The default differs per process (API: bullmq producer,
 * worker: inline for local dev), so callers apply their own default.
 */
export const queueBackendSchema = z.enum(["bullmq", "sqs", "inline"]);

/** SMTP/email settings shared by the API and worker notification paths. */
export const smtpEnvShape = {
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
} as const;

/** Sentry settings shared by the API and worker. */
export const sentryEnvShape = {
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  SENTRY_RELEASE: z.string().optional(),
} as const;

/** AES-256-GCM key (hex/base64, 32 bytes) used by both processes. */
export const fieldEncryptionKeySchema = z.string().optional();

/** Stripe secret key (optional in both processes). */
export const stripeSecretKeySchema = z.string().optional();

/** Per-request Supabase client timeout shared by the API client factories. */
export const SUPABASE_CLIENT_DB_TIMEOUT_MS = 30_000;

/**
 * Shared auth options for server-side Supabase clients: no session
 * persistence and no background token refresh — both processes authenticate
 * with the service-role key or an explicit per-request JWT.
 */
export const supabaseAuthOptions = {
  autoRefreshToken: false,
  persistSession: false,
} as const;

/**
 * Builds a Redis connection URL, injecting REDIS_PASSWORD when the URL does
 * not already carry credentials. Used by ioredis / node-redis / BullMQ.
 */
export function resolveRedisUrl(url: string, password?: string): string {
  if (!password) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.username && !parsed.password) {
      parsed.password = password;
      return parsed.toString();
    }
  } catch {
    // Malformed URL — leave as-is, the client will surface the error.
  }
  return url;
}
