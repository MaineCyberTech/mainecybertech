import express from "express";
import request from "supertest";
import { getRequestAbortSignal, requestTimeout } from "../middleware/request-timeout";

// RES-P3-010 / ARCH-P3-004: the timeout must abort the handler's signal and
// close the connection, not just answer 408 while the handler keeps running.
describe("requestTimeout middleware", () => {
  it("answers 408 and aborts the handler signal when the deadline elapses", async () => {
    const app = express();
    app.use(requestTimeout(50));
    let observed: AbortSignal | undefined;
    app.get("/slow", async (req, res) => {
      observed = getRequestAbortSignal(req);
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!res.headersSent) res.json({ ok: true });
    });

    const res = await request(app).get("/slow");

    expect(res.status).toBe(408);
    expect(res.body.error.code).toBe("REQUEST_TIMEOUT");
    expect(observed?.aborted).toBe(true);
  });

  it("does not abort a handler that answers before the deadline", async () => {
    const app = express();
    app.use(requestTimeout(5_000));
    let observed: AbortSignal | undefined;
    app.get("/fast", (req, res) => {
      observed = getRequestAbortSignal(req);
      res.json({ ok: true });
    });

    const res = await request(app).get("/fast");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(observed?.aborted).toBe(false);
  });
});
