import express, { type RequestHandler } from "express";

/**
 * WH-P3-004 / BILL-P3-001: the raw body is the exact received byte sequence.
 * It used to be captured as a UTF-8 string while consumers typed it as a
 * `Buffer` and cast it — a byte-mutation or non-UTF8 payload would then verify
 * against re-encoded bytes rather than what the provider actually signed.
 * Express declares the property here so every webhook route reads it without
 * a cast.
 */
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

/**
 * WH-P2-006: per-provider inbound webhook body limits.
 *
 * Inbound webhook routes previously shared the global 10mb JSON parser, so an
 * unauthenticated caller could make the API buffer and parse up to 10mb before
 * any signature/clientState check ran. Each provider now gets an explicit,
 * tighter cap. This middleware is mounted BEFORE the global parser (see
 * app.ts), so an oversized body is rejected with 413 before it is buffered or
 * parsed; paths without a provider-specific limit keep the global 10mb limit.
 *
 * Provider payloads are small (Stripe events with large invoices are the
 * largest; Graph change notifications are a few KB), so these caps leave ample
 * headroom while bounding the unauthenticated work an attacker can trigger.
 */
export const WEBHOOK_BODY_LIMITS: Record<string, string> = {
  stripe: "1mb",
  jira: "512kb",
  jsm: "512kb",
  m365: "256kb",
};

// Same JSON content types the global parser accepts; CSP reports are included
// because the global parser historically accepted them on every route.
const JSON_TYPES = ["application/json", "application/csp-report", "application/reports+json"];

function captureRawBody(
  req: express.Request,
  _res: express.Response,
  buf: Buffer,
): void {
  // Store the bytes, not a re-encoded string (WH-P3-004 / BILL-P3-001).
  req.rawBody = buf;
}

function jsonParser(limit: string): RequestHandler {
  return express.json({
    limit,
    type: JSON_TYPES,
    verify: captureRawBody,
  });
}

export function webhookBodyParser(): RequestHandler {
  const stripeParser = jsonParser(WEBHOOK_BODY_LIMITS.stripe);
  const jiraParser = jsonParser(WEBHOOK_BODY_LIMITS.jira);
  const jsmParser = jsonParser(WEBHOOK_BODY_LIMITS.jsm);
  const m365Parser = jsonParser(WEBHOOK_BODY_LIMITS.m365);
  const fallbackParser = jsonParser("10mb");

  return (req, res, next) => {
    // Normalize a trailing slash so `/stripe/` gets the provider cap too.
    // A static switch (not a request-path-keyed lookup) keeps the dispatch
    // table closed over our own parsers.
    const path = req.path.length > 1 ? req.path.replace(/\/+$/, "") : req.path;
    switch (path) {
      case "/api/v1/webhooks/stripe":
        stripeParser(req, res, next);
        return;
      case "/api/v1/webhooks/jira":
        jiraParser(req, res, next);
        return;
      case "/api/v1/webhooks/jsm":
        jsmParser(req, res, next);
        return;
      case "/api/v1/webhooks/m365":
        m365Parser(req, res, next);
        return;
      default:
        fallbackParser(req, res, next);
    }
  };
}
