/**
 * PRIV-P2-001: cookie/analytics consent is opt-in and persisted client-side.
 * The API is the only server-side anchor for an anonymous visitor, so the
 * stored choice is forwarded to `/public/init` (see lib/public-init.ts) and
 * recorded on the interaction row.
 *
 * Storage is read defensively: unavailable storage (private mode, blocked
 * cookies) or malformed payloads degrade to "no consent".
 */
export const CONSENT_STORAGE_KEY = "mct-consent-v1";
export const CONSENT_VERSION = 1;

export type ConsentChoice = "granted" | "denied";

export interface StoredConsent {
  version: number;
  analytics: ConsentChoice;
  ts: string;
}

export function readStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent> | null;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    if (parsed.analytics !== "granted" && parsed.analytics !== "denied") return null;
    return {
      version: CONSENT_VERSION,
      analytics: parsed.analytics,
      ts: typeof parsed.ts === "string" ? parsed.ts : "",
    };
  } catch {
    return null;
  }
}

export function writeStoredConsent(analytics: ConsentChoice): StoredConsent {
  const stored: StoredConsent = {
    version: CONSENT_VERSION,
    analytics,
    ts: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // Choice still applies for this page view; it just cannot be persisted.
    }
  }
  return stored;
}

export function hasAnalyticsConsent(): boolean {
  return readStoredConsent()?.analytics === "granted";
}
