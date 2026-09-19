import { type Request, type Response, type NextFunction } from "express";
import {
  claimIdempotencyKey,
  checkIdempotencyKey,
  deleteIdempotencyKey,
  storeIdempotencyKey,
} from "../lib/idempotency.js";
import { logger } from "../lib/logger.js";

type StoredResponse = { kind: "json" | "send"; status: number; body: unknown };

/**
 * Idempotency-Key support for mutating requests.
 *
 * Previously this was a check-then-store, so two concurrent duplicates both
 * executed, a replay returned 409 (not the original response), and keys were
 * global (colliding across endpoints/tenants). Now:
 *  - the key is ATOMICALLY claimed (SET NX) before the handler runs;
 *  - the first successful response is stored and REPLAYED for later retries;
 *  - a concurrent duplicate still in flight gets 409;
 *  - the key is scoped by method + route so it namespaces per endpoint.
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers["idempotency-key"];
  if (!header || typeof header !== "string") {
    return next();
  }
  if (header.length > 256) {
    return res.status(400).json({ error: "Idempotency-Key header too long (max 256 chars)" });
  }

  const key = `${req.method}:${req.baseUrl ?? ""}${req.path}:${header}`;

  void (async () => {
    let claimed: boolean;
    try {
      claimed = await claimIdempotencyKey(key, "processing");
    } catch (err) {
      logger.error({ key, error: String(err) }, "Idempotency claim failed");
      return next(); // fail open
    }

    if (!claimed) {
      res.setHeader("Idempotency-Key", header);
      let existing: string | null = null;
      try {
        existing = await checkIdempotencyKey(key);
      } catch (err) {
        logger.error({ key, error: String(err) }, "Idempotency lookup failed");
      }
      if (existing && existing !== "processing") {
        try {
          const stored = JSON.parse(existing) as StoredResponse;
          res.setHeader("X-Idempotent-Replay", "true");
          if (stored.kind === "json") return res.status(stored.status).json(stored.body);
          return res.status(stored.status).send(stored.body as string | undefined);
        } catch {
          // fall through to 409
        }
      }
      return res.status(409).json({
        error: "Idempotent request already in progress or processed",
        idempotencyKey: header,
      });
    }

    // We own the key: capture the response so a retry can replay it.
    let captured = false;
    const capture = (kind: StoredResponse["kind"], body: unknown) => {
      if (captured) return;
      captured = true;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        storeIdempotencyKey(key, JSON.stringify({ kind, status: res.statusCode, body })).catch(
          (err: unknown) =>
            logger.error({ key, error: String(err) }, "Failed to store idempotency key"),
        );
      } else {
        // Failed requests may be retried with the same key.
        deleteIdempotencyKey(key).catch(() => {});
      }
    };

    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      capture("json", body);
      return originalJson(body);
    }) as typeof res.json;

    const originalSend = res.send.bind(res);
    res.send = ((body?: unknown) => {
      capture("send", body);
      return originalSend(body);
    }) as typeof res.send;

    next();
  })();
}
