import { getClientEnv } from "./env";
import { hasAnalyticsConsent } from "./consent";

const API_BASE = getClientEnv().NEXT_PUBLIC_API_URL;

/**
 * PRIV-P2-001 / AN-P2-005: create the visitor session used by the public
 * forms. The API only captures IP/user-agent/geolocation once the visitor has
 * opted in, so a stored grant is forwarded as `consent=granted`. Without a
 * stored choice the request carries no consent flag and no visitor data is
 * collected by the API.
 */
export async function fetchPublicInit(): Promise<string | null> {
  const consent = hasAnalyticsConsent();
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/public/init${consent ? "?consent=granted" : ""}`,
    );
    const json = await res.json();
    const trackingId = json?.data?.trackingId;
    return typeof trackingId === "string" ? trackingId : null;
  } catch {
    return null;
  }
}
