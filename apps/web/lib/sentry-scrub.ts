/**
 * AN-P3-004: explicit PII scrubbing for web error telemetry.
 *
 * Sentry events are assembled from request context (headers, cookies, bodies),
 * `extra`/`contexts` metadata and breadcrumbs, any of which can carry personal
 * data. The SDK-level `beforeSend` hook runs on every event before transport
 * and redacts values held under known PII keys; request cookies are dropped
 * outright and `user.email`/`username`/`ip_address` are removed (the opaque
 * `user.id` is kept for triage). Free-text fields (exception messages,
 * breadcrumb messages) cannot be scrubbed reliably by key name — callers must
 * not log personal data there, same rule as the audit-metadata scrubber.
 */
const REDACTED = "[REDACTED]";

const PII_EXACT_KEYS = new Set([
  "name",
  "first_name",
  "firstname",
  "middle_name",
  "middlename",
  "last_name",
  "lastname",
  "display_name",
  "displayname",
  "title",
  "job_title",
  "jobtitle",
  "email",
  "phone",
  "ip",
  "ip_address",
  "ipaddress",
]);

const PII_SUBSTRING_KEYS = [
  "full_name",
  "fullname",
  "email",
  "phone",
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
];

/** Header names that must never leave the process even if not PII by name. */
const SENSITIVE_HEADERS = /authorization|cookie|api-key|apikey|csrf|proxy-authorization/i;

export function isSentryPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_EXACT_KEYS.has(lower) || PII_SUBSTRING_KEYS.some((field) => lower.includes(field));
}

function scrubValue(value: unknown, depth = 0): unknown {
  if (depth > 6) return REDACTED;
  if (Array.isArray(value)) {
    return value.map((entry) => scrubValue(entry, depth + 1));
  }
  if (value !== null && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      // Non-plain objects (Date, Error, …) pass through; recursing would
      // destroy their shape and they do not carry keyed PII.
      return value;
    }
    const scrubbed: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      scrubbed[key] = isSentryPiiKey(key) ? REDACTED : scrubValue(entry, depth + 1);
    }
    return scrubbed;
  }
  return value;
}

interface ScrubbableEvent {
  request?: {
    headers?: Record<string, unknown>;
    cookies?: unknown;
    data?: unknown;
  };
  user?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: Array<{ data?: Record<string, unknown> }>;
}

export function scrubSentryEvent<T>(event: T): T {
  const target = event as unknown as ScrubbableEvent;

  if (target.request) {
    if (target.request.headers) {
      for (const key of Object.keys(target.request.headers)) {
        if (SENSITIVE_HEADERS.test(key) || isSentryPiiKey(key)) {
          target.request.headers[key] = REDACTED;
        }
      }
    }
    if (target.request.cookies !== undefined) {
      delete target.request.cookies;
    }
    if (target.request.data !== undefined) {
      target.request.data = scrubValue(target.request.data);
    }
  }

  if (target.user) {
    delete target.user.email;
    delete target.user.username;
    delete target.user.ip_address;
  }

  if (target.extra) {
    target.extra = scrubValue(target.extra) as Record<string, unknown>;
  }
  if (target.contexts) {
    target.contexts = scrubValue(target.contexts) as Record<string, unknown>;
  }
  if (Array.isArray(target.breadcrumbs)) {
    for (const breadcrumb of target.breadcrumbs) {
      if (breadcrumb?.data) {
        breadcrumb.data = scrubValue(breadcrumb.data) as Record<string, unknown>;
      }
    }
  }

  return event;
}
