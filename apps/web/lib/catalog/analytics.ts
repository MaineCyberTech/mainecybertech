import { hasAnalyticsConsent } from "../consent";

interface TrackEvent {
  event: string;
  page?: string;
  productId?: string;
  categoryId?: string;
  promoId?: string;
  quizId?: string;
  quoteId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
}

const eventLog: TrackEvent[] = [];

const TRACK_PATH = "/api/v1/analytics/track";
/** Safe GET that makes the API issue the double-submit cookie (AN-P2-003). */
const CSRF_BOOTSTRAP_PATH = "/api/v1/analytics/csrf";

/**
 * The API's CSRF gate is double-submit: the cookie is readable on the web
 * origin (see middleware/csrf.ts cookieDomain) and the same value must be
 * echoed in `X-CSRF-Token`. Same read as lib/client-api.ts.
 */
function readCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? match[1] : undefined;
}

/**
 * A first-time visitor has no csrf_token yet (it is only issued by safe API
 * responses). Fetch the bootstrap route once so the POST can pass the gate.
 */
async function fetchCsrfToken(): Promise<string | undefined> {
  try {
    await fetch(CSRF_BOOTSTRAP_PATH, { method: "GET", credentials: "same-origin" });
  } catch {
    return undefined;
  }
  return readCsrfToken();
}

async function sendEvent(payload: Record<string, unknown>): Promise<void> {
  const post = (csrfToken?: string) =>
    fetch(TRACK_PATH, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      },
      body: JSON.stringify(payload),
      credentials: "same-origin",
    });

  let token = readCsrfToken();
  if (!token) token = await fetchCsrfToken();

  const response = await post(token);
  if (response.status === 403) {
    // Stale/missing cookie (e.g. rotated since it was read): refresh once and
    // retry so a legitimate first view is not silently dropped.
    token = await fetchCsrfToken();
    if (token) await post(token);
  }
}

/**
 * Fire-and-forget storefront event. Kept synchronous for callers: the event
 * is logged immediately and the network send happens in the background.
 *
 * PRIV-P2-002: the first-party analytics payload is opt-in, matching the
 * GA/Tawk.to gate. Without a stored grant the event stays in the local log and
 * nothing is sent.
 */
export function track(event: string, data?: Omit<TrackEvent, "event">): void {
  const entry: TrackEvent = { event, ...data };
  eventLog.push(entry);
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;
  try {
    const payload = {
      ...entry,
      timestamp: new Date().toISOString(),
      anonymousId: window.localStorage.getItem("anon_id"),
    };
    void sendEvent(payload).catch(() => {});
  } catch (error) {
    console.error("[catalog/analytics]", error);
  }
}

export function getEventLog(): TrackEvent[] {
  return [...eventLog];
}

export function clearEventLog(): void {
  eventLog.length = 0;
}
