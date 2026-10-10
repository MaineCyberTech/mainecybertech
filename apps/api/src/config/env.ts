import { z } from "zod";

/**
 * True when `raw` is a 64-char hex or base64 value that decodes to exactly 32
 * bytes (an AES-256 key). Kept in sync with lib/field-encryption.getKey().
 */
function isValidFieldEncryptionKey(raw?: string): boolean {
  if (!raw) return false;
  try {
    const key = /^[0-9a-fA-F]{64}$/.test(raw)
      ? Buffer.from(raw, "hex")
      : Buffer.from(raw, "base64");
    return key.length === 32;
  } catch {
    return false;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  // Optional Sentry trace sample rate (0–1). Defaults to 0.2 in production, 0
  // otherwise. See lib/sentry.ts.
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  // Optional Sentry release identifier. Defaults to process.env.GIT_SHA.
  SENTRY_RELEASE: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // AES-256-GCM key for profile PII at rest (hex/base64, 32 bytes).
  FIELD_ENCRYPTION_KEY: z.string().optional(),
  PUBLIC_TRAFFIC_WEBHOOK_URL: z.string().optional(),
  PUBLIC_LEAD_WEBHOOK_URL: z.string().optional(),
  JSM_DOMAIN: z.string().optional(),
  JSM_EMAIL: z.string().optional(),
  JSM_API_TOKEN: z.string().optional(),
  JSM_SERVICEDESK_ID: z.string().optional(),
  JSM_REQUEST_TYPE_ID: z.string().optional(),
  REDIS_URL: z.string().url().optional(),
  TASK_QUEUE_ENABLED: z.enum(["true", "false"]).optional(),
  REDIS_PASSWORD: z.string().optional(),
  JIRA_WEBHOOK_SECRET: z.string().optional(),
  JSM_WEBHOOK_SECRET: z.string().optional(),
  // Shared clientState validated on inbound M365 change notifications. This is
  // the only M365 webhook credential (Graph does not HMAC-sign payloads); see
  // routes/webhooks.ts. There is intentionally no M365_WEBHOOK_SECRET.
  M365_CLIENT_STATE: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  // Shared bearer token gating GET /metrics. When set, the endpoint 404s
  // without it; Prometheus must send `Authorization: Bearer <token>`.
  METRICS_TOKEN: z.string().optional(),
  // Opt-in MFA (aal2) enforcement: when "true", an aal1 session that has a
  // verified TOTP factor is rejected with 403 MFA_REQUIRED on non-auth routes.
  // See lib/mfa.ts. Default off so enabling it can never lock users out.
  MFA_ENFORCEMENT_ENABLED: z.enum(["true", "false"]).optional(),
  // Comma-separated module keys whose reads/writes use the user-scoped (RLS)
  // client instead of the service-role client. Empty = service-role (default).
  // Read directly from process.env by getScopedClient; documented here for
  // discoverability. See docs/RLS-rollout.md.
  RLS_READS_ENABLED: z.string().optional(),
  RLS_WRITES_ENABLED: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * SEC-P2-002: fail closed at boot in production when Turnstile is not
 * configured. The public lead endpoints (`GET /api/v1/public/init`,
 * `POST /api/v1/public/submit`) write rows and fan out to external
 * webhooks/tickets, so an unset `TURNSTILE_SECRET_KEY` must refuse startup
 * rather than silently disable the anti-bot control.
 */
export function assertProductionTurnstile(
  env: Pick<Env, "NODE_ENV" | "TURNSTILE_SECRET_KEY">,
): void {
  if (env.NODE_ENV === "production" && !env.TURNSTILE_SECRET_KEY) {
    throw new Error(
      "TURNSTILE_SECRET_KEY is required in production; refusing to run public lead endpoints with CAPTCHA disabled",
    );
  }
}

/**
 * SEC-P1-001: fail closed at boot in production. A missing or malformed
 * FIELD_ENCRYPTION_KEY must refuse startup rather than let
 * lib/field-encryption silently store PII as reversible `plain:` values.
 */
export function assertProductionSecrets(
  env: Pick<Env, "NODE_ENV" | "FIELD_ENCRYPTION_KEY">,
): void {
  if (env.NODE_ENV === "production" && !isValidFieldEncryptionKey(env.FIELD_ENCRYPTION_KEY)) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY is required in production and must decode to exactly 32 bytes (64-char hex or base64)",
    );
  }
}

/**
 * NOTIF-P2-002: fail closed at boot in production when SMTP is not
 * configured. Notification email would otherwise degrade to a silent no-op
 * (sendEmail logs a warning and returns false), invisible to users and
 * operators alike.
 */
export function assertProductionSmtp(env: Pick<Env, "NODE_ENV" | "SMTP_HOST">): void {
  if (env.NODE_ENV === "production" && !env.SMTP_HOST) {
    throw new Error(
      "SMTP_HOST is required in production; refusing to run with notification email silently disabled",
    );
  }
}

/**
 * Builds a Redis connection URL, injecting REDIS_PASSWORD when the URL
 * does not already carry credentials. Used by ioredis / node-redis clients.
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

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      throw new Error(
        `Invalid environment variables: ${JSON.stringify(result.error.flatten().fieldErrors)}`,
      );
    }
    assertProductionTurnstile(result.data);
    assertProductionSecrets(result.data);
    assertProductionSmtp(result.data);
    _env = result.data;
  }
  return _env;
}
