import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_TAWKTO_ID: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: z.string().optional(),
  NEXT_PUBLIC_SENTRY_RELEASE: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_GIT_SHA: z.string().optional(),
  NEXT_PUBLIC_BUILD_TIME: z.string().optional(),
  NEXT_PUBLIC_LOG_LEVEL: z.string().optional(),
  NEXT_PUBLIC_LOG_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD: z.string().optional(),
});

export type ClientEnvRaw = z.infer<typeof clientEnvSchema>;

export interface ClientEnv {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_GA_ID: string;
  NEXT_PUBLIC_TAWKTO_ID: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  NEXT_PUBLIC_SENTRY_DSN: string;
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: string;
  NEXT_PUBLIC_SENTRY_RELEASE: string;
  NEXT_PUBLIC_APP_VERSION: string;
  NEXT_PUBLIC_GIT_SHA: string;
  NEXT_PUBLIC_BUILD_TIME: string;
  NEXT_PUBLIC_LOG_LEVEL: string;
  NEXT_PUBLIC_LOG_ENDPOINT: string;
  NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD: string;
}

const DEFAULTS: ClientEnv = {
  NEXT_PUBLIC_API_URL: "http://localhost:4000",
  NEXT_PUBLIC_GA_ID: "",
  NEXT_PUBLIC_TAWKTO_ID: "",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: "",
  NEXT_PUBLIC_SENTRY_RELEASE: "",
  NEXT_PUBLIC_APP_VERSION: "0.0.0-dev",
  NEXT_PUBLIC_GIT_SHA: "local",
  NEXT_PUBLIC_BUILD_TIME: "",
  NEXT_PUBLIC_LOG_LEVEL: "info",
  NEXT_PUBLIC_LOG_ENDPOINT: "",
  NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD: "",
};

const warnedKeys = new Set<string>();

function warnInvalid(key: string, detail: string): void {
  if (process.env.NODE_ENV === "test" || warnedKeys.has(key)) return;
  warnedKeys.add(key);
  const fullKey = `NEXT_PUBLIC_${key}` as keyof ClientEnv;
  console.warn(
    `[env] NEXT_PUBLIC_${key} is missing or invalid (${detail}). ` +
      `Falling back to "${DEFAULTS[fullKey] ?? ""}". ` +
      "Check apps/web/.env.example.",
  );
}

export function getClientEnv(): ClientEnv {
  const raw = {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_TAWKTO_ID: process.env.NEXT_PUBLIC_TAWKTO_ID,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_GIT_SHA: process.env.NEXT_PUBLIC_GIT_SHA,
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_LOG_ENDPOINT: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
    NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD: process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD,
  };

  // SECRET-P3-002: a production build with no NEXT_PUBLIC_API_URL used to fall
  // back to http://localhost:4000 with only a console warning, so the deployed
  // app silently pointed at nothing. Fail loudly instead; the deploy workflow
  // always passes it as a build arg, so this only fires on misconfiguration.
  if (process.env.NODE_ENV === "production" && !raw.NEXT_PUBLIC_API_URL) {
    throw new Error(
      "[env] NEXT_PUBLIC_API_URL is required in production; refusing to fall back to " +
        `${DEFAULTS.NEXT_PUBLIC_API_URL}. Set it as a build arg (see deploy-do.yml build-web).`,
    );
  }

  const result = clientEnvSchema.safeParse(raw);
  if (result.success) {
    const data = result.data;
    return {
      NEXT_PUBLIC_API_URL: data.NEXT_PUBLIC_API_URL ?? DEFAULTS.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_GA_ID: data.NEXT_PUBLIC_GA_ID ?? DEFAULTS.NEXT_PUBLIC_GA_ID,
      NEXT_PUBLIC_TAWKTO_ID: data.NEXT_PUBLIC_TAWKTO_ID ?? DEFAULTS.NEXT_PUBLIC_TAWKTO_ID,
      NEXT_PUBLIC_TURNSTILE_SITE_KEY:
        data.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? DEFAULTS.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      NEXT_PUBLIC_SENTRY_DSN: data.NEXT_PUBLIC_SENTRY_DSN ?? DEFAULTS.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE:
        data.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ??
        DEFAULTS.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      NEXT_PUBLIC_SENTRY_RELEASE:
        data.NEXT_PUBLIC_SENTRY_RELEASE ?? DEFAULTS.NEXT_PUBLIC_SENTRY_RELEASE,
      NEXT_PUBLIC_APP_VERSION: data.NEXT_PUBLIC_APP_VERSION ?? DEFAULTS.NEXT_PUBLIC_APP_VERSION,
      NEXT_PUBLIC_GIT_SHA: data.NEXT_PUBLIC_GIT_SHA ?? DEFAULTS.NEXT_PUBLIC_GIT_SHA,
      NEXT_PUBLIC_BUILD_TIME: data.NEXT_PUBLIC_BUILD_TIME ?? DEFAULTS.NEXT_PUBLIC_BUILD_TIME,
      NEXT_PUBLIC_LOG_LEVEL: data.NEXT_PUBLIC_LOG_LEVEL ?? DEFAULTS.NEXT_PUBLIC_LOG_LEVEL,
      NEXT_PUBLIC_LOG_ENDPOINT: data.NEXT_PUBLIC_LOG_ENDPOINT ?? DEFAULTS.NEXT_PUBLIC_LOG_ENDPOINT,
      NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD:
        data.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? DEFAULTS.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD,
    };
  }
  for (const issue of result.error.issues) {
    const fullKey = String(issue.path[0] ?? "");
    if (!fullKey) continue;
    const display = fullKey.replace(/^NEXT_PUBLIC_/, "");
    warnInvalid(display, `${issue.message} (${fullKey})`);
  }
  return { ...DEFAULTS };
}

export const env = getClientEnv();
