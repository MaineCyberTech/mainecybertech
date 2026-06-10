import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  API_PORT: z.coerce.number().default(4000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "silent"])
    .default("info"),
  JWT_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PUBLIC_TRAFFIC_WEBHOOK_URL: z.string().optional(),
  PUBLIC_LEAD_WEBHOOK_URL: z.string().optional(),
  JSM_DOMAIN: z.string().optional(),
  JSM_EMAIL: z.string().optional(),
  JSM_API_TOKEN: z.string().optional(),
  JSM_SERVICEDESK_ID: z.string().optional(),
  JSM_REQUEST_TYPE_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error(
        "Invalid environment variables:",
        result.error.flatten().fieldErrors,
      );
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
