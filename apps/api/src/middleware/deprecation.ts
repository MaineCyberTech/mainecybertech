import { type Request, type RequestHandler, type Response } from "express";

/**
 * Deprecation/Sunset enforcement (EVOL-P3-004).
 *
 * `docs/API_VERSIONING.md` documented a deprecation policy ("endpoints being
 * removed should return a Sunset header") but nothing implemented it. This
 * module is the enforcement point:
 *
 *   - `DEPRECATIONS` is the single registry of deprecated paths. Each entry
 *     carries the RFC 8594 `Sunset` HTTP-date, the canonical successor (RFC
 *     8288 `rel="successor-version"`), and a link to the migration notes (RFC
 *     9745 `rel="deprecation"`).
 *   - `deprecationMiddleware()` is mounted app-wide (app.ts) and stamps the
 *     headers on every matching request, so a path keeps advertising its
 *     sunset even when it no longer resolves to a live route.
 *   - `deprecationNotice(policy)` attaches the same headers to a single route
 *     when a handler is still serving traffic.
 *   - `goneRoute(key)` (lib/deprecated-route.ts) reuses the same registry for
 *     hard-deprecated aliases that fail closed with 410.
 *
 * Adding a deprecation: add a registry entry, wire `goneRoute(key)` or
 * `deprecationNotice(key)` where appropriate, and note it in
 * docs/API_VERSIONING.md. A CI test asserts the header shape.
 */

export interface DeprecationPolicy {
  /** Path prefix the policy applies to (relative to the API host). */
  path: string;
  /** RFC 8594 `Sunset` HTTP-date, e.g. `Mon, 12 Oct 2026 00:00:00 GMT`. */
  sunset: string;
  /** Canonical replacement path advertised via `rel="successor-version"`. */
  successor: string;
  /** Link to migration notes advertised via `rel="deprecation"`. */
  migrationDoc?: string;
}

export const DEPRECATIONS = {
  /**
   * FEAT-P2-005: `satisfaction_pulses` is canonically served by
   * `/api/v1/satisfaction-pulse`; the duplicate `/final/satisfaction` alias
   * was removed on 2026-10-12.
   */
  "final/satisfaction": {
    path: "/api/v1/final/satisfaction",
    sunset: "Mon, 12 Oct 2026 00:00:00 GMT",
    successor: "/api/v1/satisfaction-pulse",
    migrationDoc: "docs/API_VERSIONING.md",
  },
  /**
   * FEAT-P2-005: `sop_library` is canonically served by
   * `/api/v1/governance/sop-library`; the duplicate `/edu-automation/sop`
   * alias was removed on 2026-10-12.
   */
  "edu-automation/sop": {
    path: "/api/v1/edu-automation/sop",
    sunset: "Mon, 12 Oct 2026 00:00:00 GMT",
    successor: "/api/v1/governance/sop-library",
    migrationDoc: "docs/API_VERSIONING.md",
  },
  /**
   * FEAT-P2-005: `insurance_evidence` is canonically served by
   * `/api/v1/insurance-binder`; the duplicate `/edu-automation/insurance`
   * alias was removed on 2026-10-12.
   */
  "edu-automation/insurance": {
    path: "/api/v1/edu-automation/insurance",
    sunset: "Mon, 12 Oct 2026 00:00:00 GMT",
    successor: "/api/v1/insurance-binder",
    migrationDoc: "docs/API_VERSIONING.md",
  },
} as const satisfies Record<string, DeprecationPolicy>;

export type DeprecationKey = keyof typeof DEPRECATIONS;

/** Header map for one policy (RFC 9745 Deprecation, RFC 8594 Sunset, RFC 8288 Link). */
export function deprecationHeaders(policy: DeprecationPolicy): Record<string, string> {
  const links = [`<${policy.successor}>; rel="successor-version"`];
  if (policy.migrationDoc) links.push(`<${policy.migrationDoc}>; rel="deprecation"`);
  return {
    Deprecation: "true",
    Sunset: policy.sunset,
    Link: links.join(", "),
  };
}

function applyPolicy(res: Response, policy: DeprecationPolicy): void {
  for (const [name, value] of Object.entries(deprecationHeaders(policy))) {
    res.setHeader(name, value);
  }
}

/** Per-route middleware: serve traffic while advertising the sunset. */
export function deprecationNotice(key: DeprecationKey): RequestHandler {
  const policy = DEPRECATIONS[key];
  return (_req, res, next) => {
    applyPolicy(res, policy);
    next();
  };
}

function matches(policy: DeprecationPolicy, req: Request): boolean {
  const path = (req.originalUrl ?? req.path).split("?")[0];
  return path === policy.path || path.startsWith(`${policy.path}/`);
}

/**
 * App-wide middleware: stamp deprecation headers on every request whose path
 * is registered in `DEPRECATIONS`. Runs before the routers so even 404s on a
 * removed path advertise the successor.
 */
export function deprecationMiddleware(): RequestHandler {
  const policies = Object.values(DEPRECATIONS);
  return (req, res, next) => {
    for (const policy of policies) {
      if (matches(policy, req)) {
        applyPolicy(res, policy);
        break;
      }
    }
    next();
  };
}
