import { z } from "zod";

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_TAWKTO_ID: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export type ClientEnvRaw = z.infer<typeof clientEnvSchema>;

export interface ClientEnv {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_GA_ID: string;
  NEXT_PUBLIC_TAWKTO_ID: string;
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
  NEXT_PUBLIC_SENTRY_DSN: string;
}

const DEFAULTS: ClientEnv = {
  NEXT_PUBLIC_API_URL: "http://localhost:4000",
  NEXT_PUBLIC_GA_ID: "",
  NEXT_PUBLIC_TAWKTO_ID: "",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
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
  };
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
