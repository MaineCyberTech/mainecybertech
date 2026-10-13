#!/usr/bin/env node
// Edge fault injector for the k6 failure-injection scenario (TEST-P2-004).
//
// A tiny local reverse proxy in front of the target API with two modes:
//   pass   — forward the request to UPSTREAM_URL unchanged;
//   inject — answer every request with INJECT_STATUS (default 503), i.e. a
//            simulated edge/dependency 5xx burst.
//
// The mode is flipped at runtime by load-test.yml through the loopback-only
// control endpoint (POST /__control {"mode":"inject"|"pass"}), so the
// failure-injection scenario can prove in one job that:
//   1. baseline traffic passes the committed budgets,
//   2. a 5xx burst breaches the error budget (k6 exit 99), and
//   3. traffic passes again after recovery.
//
// Usage:
//   UPSTREAM_URL=https://api.example.com PORT=8080 node fault-injector.mjs

import http from "node:http";

const UPSTREAM_URL = (process.env.UPSTREAM_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
const PORT = Number(process.env.PORT || 8080);
const INJECT_STATUS = Number(process.env.INJECT_STATUS || 503);

let mode = "pass";

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Loopback control plane — never proxied, never in `inject` mode.
  if (req.url === "/__ready") {
    json(res, 200, { ready: true, mode, upstream: UPSTREAM_URL });
    return;
  }
  if (req.url === "/__control") {
    if (req.method === "GET") {
      json(res, 200, { mode });
      return;
    }
    if (req.method !== "POST") {
      json(res, 405, { error: "use GET or POST" });
      return;
    }
    try {
      const parsed = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      if (parsed.mode !== "pass" && parsed.mode !== "inject") {
        json(res, 400, { error: "mode must be pass or inject" });
        return;
      }
      mode = parsed.mode;
      console.log(`[fault-injector] mode=${mode}`);
      json(res, 200, { mode });
    } catch {
      json(res, 400, { error: "invalid JSON body" });
    }
    return;
  }

  if (mode === "inject") {
    json(res, INJECT_STATUS, { injected: true, error: "simulated dependency outage" });
    return;
  }

  try {
    const headers = {};
    for (const [name, value] of Object.entries(req.headers)) {
      // Hop-by-hop and length headers are recomputed; undici rejects
      // undefined values.
      if (["host", "connection", "content-length", "accept-encoding"].includes(name)) continue;
      if (value !== undefined) headers[name] = value;
    }
    const body = ["GET", "HEAD"].includes(req.method || "")
      ? undefined
      : await readBody(req);

    const upstream = await fetch(`${UPSTREAM_URL}${req.url}`, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const payload = Buffer.from(await upstream.arrayBuffer());
    const responseHeaders = {};
    upstream.headers.forEach((value, name) => {
      if (["content-encoding", "content-length", "transfer-encoding", "connection"].includes(name)) return;
      responseHeaders[name] = value;
    });
    res.writeHead(upstream.status, responseHeaders);
    res.end(payload);
  } catch (err) {
    json(res, 502, { error: `upstream unreachable: ${err instanceof Error ? err.message : String(err)}` });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[fault-injector] listening on 127.0.0.1:${PORT} -> ${UPSTREAM_URL} (mode=${mode})`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
