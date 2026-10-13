#!/usr/bin/env node
// Functional smoke check (TEST-P3-002).
//
// Runs on a GitHub Actions runner — outside the droplet — and exercises the
// user path end to end, not just status codes: API /health, the web /login
// page, and an authenticated read (sign-in + GET /api/v1/auth/me). The deploy
// health gate and the uptime probe only assert status/latency; this is the
// scheduled check that a login and a tenant read still work after deploy.
//
// Targets: dev by default; prod is only exercised once the operator enables it
// (SMOKE_TARGET=prod|both and the prod environment exists). See
// .github/workflows/smoke-check.yml and docs/MONITORING_AND_ALERTING.md.
//
// Environment:
//   SMOKE_TARGET            dev | prod | both            (default: dev)
//   SMOKE_DEV_API_BASE      default https://api.mainecybertech.us
//   SMOKE_DEV_WEB_BASE      default https://app.mainecybertech.us
//   SMOKE_PROD_API_BASE     default https://api.mainecybertech.com
//   SMOKE_PROD_WEB_BASE     default https://app.mainecybertech.com
//   SMOKE_EMAIL / SMOKE_PASSWORD   optional read-only smoke account; when unset
//                                  the authenticated read is reported skipped
//   SMOKE_REPORT_PATH       default smoke-report.json
//   SMOKE_ATTEMPTS          default 2 (transient network retries)
//
// Usage: node scripts/uptime/smoke.mjs
import { writeFileSync } from "node:fs";

const REPORT_PATH = process.env.SMOKE_REPORT_PATH || "smoke-report.json";
const ATTEMPTS = Math.max(1, Number(process.env.SMOKE_ATTEMPTS || 2));
const BACKOFF_MS = Math.max(0, Number(process.env.SMOKE_BACKOFF_MS || 3000));
const TARGET = (process.env.SMOKE_TARGET || "dev").toLowerCase();

const TARGETS = {
  dev: {
    api: process.env.SMOKE_DEV_API_BASE || "https://api.mainecybertech.us",
    web: process.env.SMOKE_DEV_WEB_BASE || "https://app.mainecybertech.us",
  },
  prod: {
    api: process.env.SMOKE_PROD_API_BASE || "https://api.mainecybertech.com",
    web: process.env.SMOKE_PROD_WEB_BASE || "https://app.mainecybertech.com",
  },
};

function selectedTargets() {
  if (TARGET === "both") return ["dev", "prod"];
  if (TARGET === "dev" || TARGET === "prod") return [TARGET];
  console.error(`smoke: unknown SMOKE_TARGET "${TARGET}" (expected dev, prod or both)`);
  process.exit(2);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url, init = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(Number(process.env.SMOKE_TIMEOUT_MS || 10000)),
      headers: { "user-agent": "mct-smoke-check/1.0 (+https://github.com/MaineCyberTech/mainecybertech)" },
      ...init,
    });
    const body = await res.text().catch(() => "");
    return { ok: true, status: res.status, latencyMs: Date.now() - started, body };
  } catch (err) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Run a check up to ATTEMPTS times; the first success wins. */
async function withRetry(name, fn) {
  let last;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    last = await fn();
    if (last.pass) return last;
    if (attempt < ATTEMPTS) {
      console.log(`smoke: ${name} failed (attempt ${attempt}/${ATTEMPTS}) — retrying in ${BACKOFF_MS}ms`);
      await sleep(BACKOFF_MS);
    }
  }
  return last;
}

function check(name, pass, detail) {
  return { name, pass, detail };
}

async function smokeTarget(env) {
  const { api, web } = TARGETS[env];
  const checks = [];

  checks.push(
    await withRetry("api-health", async () => {
      const res = await request(`${api}/health`);
      const pass = res.ok && res.status === 200;
      return check("api-health", pass, res.ok ? `HTTP ${res.status}` : res.error);
    }),
  );

  checks.push(
    await withRetry("web-login", async () => {
      const res = await request(`${web}/login`);
      // A redirect is a valid answer (the login page may redirect to a
      // canonical host); a 200 must actually render HTML.
      const pass =
        res.ok &&
        [200, 301, 302, 307].includes(res.status) &&
        (res.status !== 200 || /<html/i.test(res.body));
      return check("web-login", pass, res.ok ? `HTTP ${res.status}` : res.error);
    }),
  );

  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    checks.push(check("auth-read", false, "skipped — SMOKE_EMAIL/SMOKE_PASSWORD not configured"));
  } else {
    checks.push(
      await withRetry("auth-read", async () => {
        const signIn = await request(`${api}/api/v1/auth/sign-in`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!signIn.ok || signIn.status !== 200) {
          return check("auth-read", false, signIn.ok ? `sign-in HTTP ${signIn.status}` : signIn.error);
        }
        let payload;
        try {
          payload = JSON.parse(signIn.body);
        } catch {
          return check("auth-read", false, "sign-in response was not JSON");
        }
        if (payload?.data?.mfaRequired === true) {
          return check("auth-read", false, "smoke account has MFA enabled — use a dedicated non-MFA account");
        }
        const token = payload?.data?.accessToken;
        if (!token) return check("auth-read", false, "sign-in response carried no accessToken");

        const me = await request(`${api}/api/v1/auth/me`, {
          headers: { authorization: `Bearer ${token}` },
        });
        if (!me.ok || me.status !== 200) {
          return check("auth-read", false, me.ok ? `auth/me HTTP ${me.status}` : me.error);
        }
        let mePayload;
        try {
          mePayload = JSON.parse(me.body);
        } catch {
          return check("auth-read", false, "auth/me response was not JSON");
        }
        if (!mePayload?.data?.userId) {
          return check("auth-read", false, "auth/me response carried no userId");
        }
        return check("auth-read", true, `signed in and read ${mePayload.data.userId}`);
      }),
    );
  }

  const failed = checks.filter((c) => !c.pass && !c.detail.startsWith("skipped"));
  const skipped = checks.filter((c) => c.detail.startsWith("skipped"));
  return { environment: env, api, web, checks, failed: failed.length, skipped: skipped.length };
}

const results = [];
for (const env of selectedTargets()) {
  results.push(await smokeTarget(env));
}

const report = {
  checkedAt: new Date().toISOString(),
  target: TARGET,
  results,
  failed: results.reduce((n, r) => n + r.failed, 0),
  skipped: results.reduce((n, r) => n + r.skipped, 0),
};
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

const lines = [
  "## Smoke check",
  "",
  "| Environment | Check | Result | Detail |",
  "| --- | --- | --- | --- |",
];
for (const result of results) {
  for (const c of result.checks) {
    const verdict = c.pass ? "✅ pass" : c.detail.startsWith("skipped") ? "⏭️ skipped" : "❌ fail";
    lines.push(`| ${result.environment} | ${c.name} | ${verdict} | ${c.detail} |`);
  }
}
if (report.skipped > 0) {
  lines.push("");
  lines.push(
    "The authenticated read is skipped until the `SMOKE_EMAIL`/`SMOKE_PASSWORD` secrets are provisioned (read-only smoke account).",
  );
}
console.log(lines.join("\n"));

if (report.failed > 0) {
  console.error(`smoke: ${report.failed} check(s) failed`);
  process.exit(1);
}
console.log(`smoke: all checks passed (${report.skipped} skipped)`);
