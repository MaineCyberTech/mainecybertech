#!/usr/bin/env node
// External uptime probe (audit OBS-P2-016).
//
// Runs on a GitHub Actions runner — outside the droplet — and checks the
// public platform endpoints' status codes and latency budgets. This is the
// layer the in-stack Prometheus cannot cover: if DNS, Cloudflare, the edge
// proxy or the droplet itself is unreachable, every internal scrape is still
// green but users are down.
//
// Config: scripts/uptime/probe-targets.json, overridable with the
// UPTIME_PROBE_TARGETS env var (JSON array, or {"targets":[...]}).
// Writes uptime-report.json and exits 1 when any target fails.
//
// Usage: node scripts/uptime/probe.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CONFIG_PATH =
  process.env.UPTIME_PROBE_CONFIG || join(ROOT, "scripts", "uptime", "probe-targets.json");
const REPORT_PATH = process.env.UPTIME_REPORT_PATH || "uptime-report.json";
const ATTEMPTS = Math.max(1, Number(process.env.UPTIME_ATTEMPTS || 3));
const BACKOFF_MS = Math.max(0, Number(process.env.UPTIME_BACKOFF_MS || 5000));

function fail(message) {
  console.error(`uptime probe: ${message}`);
  process.exit(1);
}

function loadTargets() {
  const override = (process.env.UPTIME_PROBE_TARGETS || "").trim();
  let parsed;
  try {
    parsed = JSON.parse(override || readFileSync(CONFIG_PATH, "utf8"));
  } catch (err) {
    fail(`cannot parse target config (${override ? "UPTIME_PROBE_TARGETS" : CONFIG_PATH}): ${err.message}`);
  }

  const targets = Array.isArray(parsed) ? parsed : parsed.targets;
  if (!Array.isArray(targets) || targets.length === 0) {
    fail("no probe targets configured (refusing to report a green run)");
  }
  for (const target of targets) {
    if (!target || typeof target.url !== "string" || !/^https?:\/\//.test(target.url)) {
      fail(`target ${target && target.name ? target.name : "?"} has no http(s) url`);
    }
    if (!Array.isArray(target.expectStatus) || target.expectStatus.length === 0) {
      fail(`target ${target.name || target.url} has no expectStatus list`);
    }
    if (!Number.isFinite(target.maxLatencyMs) || target.maxLatencyMs <= 0) {
      fail(`target ${target.name || target.url} has no positive maxLatencyMs budget`);
    }
  }
  return targets;
}

async function probeOnce(target) {
  const started = Date.now();
  try {
    const res = await fetch(target.url, {
      redirect: "manual",
      signal: AbortSignal.timeout(Number(target.timeoutMs || 10000)),
      headers: {
        "user-agent": "mct-uptime-probe/1.0 (+https://github.com/MaineCyberTech/mainecybertech)",
      },
    });
    const latencyMs = Date.now() - started;
    await res.arrayBuffer().catch(() => {});
    const statusOk = target.expectStatus.includes(res.status);
    const latencyOk = latencyMs <= target.maxLatencyMs;
    return { ok: statusOk && latencyOk, status: res.status, latencyMs, statusOk, latencyOk };
  } catch (err) {
    return {
      ok: false,
      status: null,
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function probeTarget(target) {
  const attempts = [];
  for (let i = 1; i <= ATTEMPTS; i += 1) {
    const attempt = await probeOnce(target);
    attempts.push(attempt);
    // Any single attempt passing both the status and the latency budget marks
    // the target up: GitHub runners and the public internet are noisy, and a
    // single cold TCP/TLS handshake should not page anyone. A target that
    // fails every attempt is a real outage.
    if (attempt.ok) break;
    if (i < ATTEMPTS) await new Promise((r) => setTimeout(r, BACKOFF_MS));
  }
  const passed = attempts.some((a) => a.ok);
  return {
    name: target.name || target.url,
    url: target.url,
    expectStatus: target.expectStatus,
    maxLatencyMs: target.maxLatencyMs,
    attempts,
    ok: passed,
  };
}

const targets = loadTargets();
const results = [];
for (const target of targets) {
  // Sequential on purpose: the list is short, and interleaved output makes
  // incident triage harder.
  results.push(await probeTarget(target));
}

const failed = results.filter((r) => !r.ok);
const report = {
  probedAt: new Date().toISOString(),
  runner: process.env.GITHUB_RUN_ID ? `github-actions/${process.env.GITHUB_RUN_ID}` : "local",
  results,
  failed: failed.map((r) => r.name),
};
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.log(`## External uptime probe (${report.probedAt})`);
console.log("");
console.log("| Target | Result | Status | Latency | Budget |");
console.log("| ------ | ------ | ------ | ------- | ------ |");
for (const r of results) {
  const best = r.attempts.find((a) => a.ok) || r.attempts[r.attempts.length - 1];
  const status = best.status === null ? (best.error || "no response") : best.status;
  console.log(
    `| ${r.name} | ${r.ok ? "PASS" : "FAIL"} | ${status} | ${best.latencyMs} ms | ${r.maxLatencyMs} ms |`,
  );
}
console.log("");
for (const r of results) {
  console.log(`- ${r.name}: ${r.attempts.length}/${ATTEMPTS} attempt(s), ${r.url}`);
}

if (failed.length > 0) {
  console.error(`uptime probe FAILED: ${failed.map((r) => r.name).join(", ")}`);
  process.exit(1);
}
console.log("All probed endpoints are up within their latency budgets.");
