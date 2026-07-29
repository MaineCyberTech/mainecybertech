import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).default("info"),
  WORKER_CONCURRENCY: z.coerce.number().default(10),
  WORKER_TIMEOUT: z.coerce.number().default(30000),
  QUEUE_BACKEND: z.enum(["bullmq", "sqs"]).default("bullmq"),
  REDIS_URL: z.string().default("redis://redis:6379"),
  SQS_QUEUE_URL: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().optional(),
  JIRA_BASE_URL: z.string().optional(),
  JIRA_EMAIL: z.string().optional(),
  JIRA_API_TOKEN: z.string().optional(),
  JSM_BASE_URL: z.string().optional(),
  JSM_EMAIL: z.string().optional(),
  JSM_API_TOKEN: z.string().optional(),
  M365_TENANT_ID: z.string().optional(),
  M365_CLIENT_ID: z.string().optional(),
  M365_CLIENT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  API_BASE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().optional(),
  HEALTH_PORT: z.coerce.number().default(3001),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  return envSchema.parse(raw);
}

let env: Env;
try {
  env = parseEnv(process.env);
  // eslint-disable-next-line no-console
  console.log("Environment validation passed");
} catch (error) {
  throw new Error(
    `Invalid environment variables: ${error instanceof Error ? error.message : String(error)}`,
  );
}

export { env };
