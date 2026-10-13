import { type Request, type Response, type NextFunction } from "express";

/**
 * RES-P3-010 / ARCH-P3-004: the deadline is real, not advisory.
 *
 * When the timer fires the middleware now:
 *  1. aborts an AbortSignal attached to the request (read it with
 *     `getRequestAbortSignal(req)` and pass it to outbound fetches / long
 *     loops so the handler actually stops), and
 *  2. answers 408 and then destroys the socket once the response has flushed,
 *     so the client cannot reuse a keep-alive connection whose handler is
 *     still running.
 *
 * Handlers that never read the signal still get the connection close; the
 * signal is the supported way to cancel work. Note that a 408 can race a
 * mutation that was already committed — mutations should keep sending an
 * Idempotency-Key (see `middleware/idempotency.ts`).
 */
const requestSignals = new WeakMap<Request, AbortSignal>();

/** The request's deadline signal, when `requestTimeout` is in the pipeline. */
export function getRequestAbortSignal(req: Request): AbortSignal | undefined {
  return requestSignals.get(req);
}

export function requestTimeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const controller = new AbortController();
    requestSignals.set(req, controller.signal);

    const timer = setTimeout(() => {
      controller.abort(new Error(`Request exceeded ${ms}ms timeout`));
      if (!res.headersSent) {
        // Close the connection after the 408 flushes; destroying first would
        // truncate the response the client needs to see.
        res.once("finish", () => req.destroy());
        res.status(408).json({
          error: {
            code: "REQUEST_TIMEOUT",
            message: `Request exceeded ${ms}ms timeout`,
          },
        });
      } else {
        req.destroy();
      }
    }, ms);

    res.on("finish", () => clearTimeout(timer));
    // Client disconnect: stop the timer; the request object is gone.
    res.on("close", () => clearTimeout(timer));
    next();
  };
}
