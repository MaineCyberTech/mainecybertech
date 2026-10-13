import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { z } from "zod";
import {
  fieldEncryptionKeySchema,
  logLevelSchema,
  nodeEnvSchema,
  queueBackendSchema,
  redisEnvShape,
  resolveRedisUrl,
  sentryEnvShape,
  smtpEnvShape,
  stripeSecretKeySchema,
  supabaseEnvShape,
} from "@mct/config/env";

// EVOL-P3-005: re-exported so existing call sites keep importing from
// `../env` while the implementation lives in the shared package.
export { resolveRedisUrl };

export const envSchema = z
  .object({
    NODE_ENV: nodeEnvSchema,
    LOG_LEVEL: logLevelSchema,
    WORKER_CONCURRENCY: z.coerce.number().int().positive().default(10),
    WORKER_TIMEOUT: z.coerce.number().int().positive().default(30000),
    // RES-P2-002: the BullMQ lock duration above is not a handler deadline.
    // This is the real per-task deadline: the registry aborts the handler's
    // AbortSignal and fails the task once it elapses. Default 10 minutes —
    // longer than the longest scan lock TTL, short enough to surface a hang.
    WORKER_TASK_TIMEOUT_MS: z.coerce.number().int().positive().default(600000),
    QUEUE_BACKEND: queueBackendSchema.default("inline"),
    ...redisEnvShape,
    SQS_QUEUE_URL: z.string().optional(),
    ...supabaseEnvShape,
    // AES-256-GCM key (hex/base64, 32 bytes) used to decrypt outbound webhook
    // signing secrets at rest. Written by the deploy workflow; without it
    // encrypted secrets cannot be decrypted and deliveries fail closed.
    FIELD_ENCRYPTION_KEY: fieldEncryptionKeySchema,
    STRIPE_SECRET_KEY: stripeSecretKeySchema,
    JIRA_BASE_URL: z.string().optional(),
    JIRA_EMAIL: z.string().optional(),
    JIRA_API_TOKEN: z.string().optional(),
    JSM_BASE_URL: z.string().optional(),
    JSM_EMAIL: z.string().optional(),
    JSM_API_TOKEN: z.string().optional(),
    M365_TENANT_ID: z.string().optional(),
    M365_CLIENT_ID: z.string().optional(),
    M365_CLIENT_SECRET: z.string().optional(),
    ...smtpEnvShape,
    // Web Push (NOTIF-P2-001). Operator-gated: all three are required for the
    // worker to send; when any is missing the `notification-push` task no-ops
    // (records `skipped`). Keys are generated with `npx web-push
    // generate-vapid-keys` — see docs/ENVIRONMENT_VARIABLES.md.
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().optional(),
    API_BASE_URL: z.string().url().optional(),
    APP_BASE_URL: z.string().url().optional(),
    ...sentryEnvShape,
    HEALTH_PORT: z.coerce.number().int().positive().max(65535).default(3001),
    // ARCH-P3-005: shared bearer token for the worker /metrics endpoint (the
    // API's METRICS_TOKEN, written by the deploy). Unset => /metrics 404s.
    METRICS_TOKEN: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    // Without Redis the BullMQ consumer warns and returns, and every timer is
    // unref'd, so the process would exit leaving the queue unconsumed.
    if (val.QUEUE_BACKEND === "bullmq" && !val.REDIS_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REDIS_URL"],
        message: "REDIS_URL is required when QUEUE_BACKEND=bullmq",
      });
    }
    // RES-P2-003 / ARCH-P2-004: the `inline` backend makes the worker idle
    // forever (tasks are only executed by callers falling back in-process) and
    // the API only ever enqueues to BullMQ, so production must be BullMQ.
    // Anything else would leave queued work unconsumed while the API reports
    // successful enqueues. `sqs`/`inline` remain available for local/dev runs.
    if (val.NODE_ENV === "production" && val.QUEUE_BACKEND !== "bullmq") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["QUEUE_BACKEND"],
        message:
          "QUEUE_BACKEND must be bullmq in production: the API only enqueues to BullMQ, so any other backend leaves queued work unconsumed (queue backend parity contract)",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}

let env: Env;
try {
  env = parseEnv(process.env);
  console.log("Environment validation passed");
  // NOTIF-P2-002: queued email is skipped without SMTP; make that visible at
  // boot (non-fatal so a deployment without SMTP still starts).
  if (env.NODE_ENV === "production" && !env.SMTP_HOST) {
    console.warn("SMTP_HOST is not configured — queued notification email will be skipped");
  }
  // NOTIF-P2-001: push is operator-gated. A partial VAPID set is almost always
  // a mistake (e.g. the public key copied but not the private), and it silently
  // disables the channel — surface it at boot.
  const vapidValues = [env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBJECT];
  if (vapidValues.some(Boolean) && !vapidValues.every(Boolean)) {
    console.warn(
      "Partial VAPID configuration — push notifications stay disabled until VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT are all set",
    );
  }
} catch (error) {
  throw new Error(
    `Invalid environment variables: ${error instanceof Error ? error.message : String(error)}`,
  );
}

export { env };
