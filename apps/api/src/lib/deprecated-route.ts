import type { RequestHandler } from "express";
import { failure } from "../types";

/**
 * FEAT-P2-005: one canonical API surface per table.
 *
 * Three tables (`sop_library`, `insurance_evidence`, `satisfaction_pulses`)
 * were each served by two routers with different validators and lifecycle
 * rules. The duplicate registrations were removed and replaced by this
 * handler, which hard-deprecates the old path: it fails the request with
 * 410 Gone and points at the canonical route via RFC 9745 `Deprecation` and
 * RFC 8288 `rel="successor-version"` headers, so callers can migrate instead
 * of silently writing through a divergent path.
 */
export function goneRoute(canonicalPath: string): RequestHandler {
  return (_req, res) => {
    res.setHeader("Deprecation", "true");
    res.setHeader("Link", `<${canonicalPath}>; rel="successor-version"`);
    res.status(410).json(failure("GONE", `This endpoint moved to ${canonicalPath}`, 410));
  };
}
