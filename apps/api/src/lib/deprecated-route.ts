import type { RequestHandler } from "express";
import { failure } from "../types";
import {
  DEPRECATIONS,
  deprecationHeaders,
  type DeprecationKey,
} from "../middleware/deprecation";

/**
 * FEAT-P2-005: one canonical API surface per table.
 *
 * Three tables (`sop_library`, `insurance_evidence`, `satisfaction_pulses`)
 * were each served by two routers with different validators and lifecycle
 * rules. The duplicate registrations were removed and replaced by this
 * handler, which hard-deprecates the old path: it fails the request with
 * 410 Gone and points at the canonical route via RFC 9745 `Deprecation`,
 * RFC 8594 `Sunset` and RFC 8288 `rel="successor-version"` headers, so
 * callers can migrate instead of silently writing through a divergent path.
 *
 * EVOL-P3-004: the sunset/successor metadata lives in the shared
 * `DEPRECATIONS` registry (middleware/deprecation.ts), which the app-wide
 * deprecation middleware also uses — one source for both.
 */
export function goneRoute(key: DeprecationKey): RequestHandler {
  const policy = DEPRECATIONS[key];
  return (_req, res) => {
    for (const [name, value] of Object.entries(deprecationHeaders(policy))) {
      res.setHeader(name, value);
    }
    res.status(410).json(failure("GONE", `This endpoint moved to ${policy.successor}`, 410));
  };
}
