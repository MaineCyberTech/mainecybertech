import dns from "node:dns";
import { AppError } from "../types";

// IPv4 private / loopback / link-local / CGNAT / reserved ranges
const PRIVATE_IPV4 =
  /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|100\.(6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])\.)/;
// multicast, reserved, documentation, benchmark ranges
const RESERVED_IPV4 =
  /^(224\.|240\.|255\.|192\.0\.0\.|192\.0\.2\.|198\.18\.|198\.51\.100\.|203\.0\.113\.)/;

const BLOCKED_HOSTNAMES = ["localhost", "localhost.localdomain", "ip6-localhost"];

export function isPrivateIpAddress(hostname: string): boolean {
  const host = hostname.toLowerCase().split("%")[0];

  if (host.includes(":")) {
    // IPv6 (or IPv4-mapped IPv6)
    if (host.startsWith("::ffff:")) {
      return isPrivateIpAddress(host.slice("::ffff:".length));
    }
    return (
      host === "::" ||
      host === "::1" ||
      host.startsWith("fc") || // fc00::/7 unique local
      host.startsWith("fd") ||
      host.startsWith("fe8") || // fe80::/10 link-local
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb") ||
      host.startsWith("2001:db8:") // documentation
    );
  }

  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return false;
  const parts = host.split(".").map(Number);
  if (parts.some((p) => p < 0 || p > 255)) return false;
  return PRIVATE_IPV4.test(host) || RESERVED_IPV4.test(host);
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    BLOCKED_HOSTNAMES.includes(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    /^\d+$/.test(host) // decimal IPv4 form (e.g. 2130706433 = 127.0.0.1)
  );
}

/**
 * Synchronous SSRF guard — scheme + literal IP / hostname checks.
 * Use inside Zod refines or before any DNS work.
 */
export function assertSafeWebhookUrlSync(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new AppError("VALIDATION", "Invalid webhook URL", 400);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new AppError("VALIDATION", "Webhook URL must use http or https", 400);
  }

  if (isBlockedHostname(parsed.hostname) || isPrivateIpAddress(parsed.hostname)) {
    throw new AppError(
      "VALIDATION",
      "Webhook URL cannot point to a private, loopback, or local host",
      400,
    );
  }
}

/**
 * Full SSRF guard — also resolves DNS and rejects hostnames that resolve to
 * private / loopback / link-local addresses (defense against DNS rebinding to
 * internal hosts).
 */
export async function assertSafeWebhookUrl(url: string): Promise<void> {
  assertSafeWebhookUrlSync(url);

  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  if (/^\d/.test(hostname) && hostname.includes(".")) {
    // Literal IP already validated synchronously
    return;
  }

  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch {
    throw new AppError("VALIDATION", "Webhook URL host could not be resolved", 400);
  }

  if (addresses.length === 0) {
    throw new AppError("VALIDATION", "Webhook URL host could not be resolved", 400);
  }

  for (const { address } of addresses) {
    if (isPrivateIpAddress(address)) {
      throw new AppError(
        "VALIDATION",
        "Webhook URL resolves to a private or loopback address",
        400,
      );
    }
  }
}
