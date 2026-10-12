#!/usr/bin/env node
/**
 * Branch-protection audit: drift detection + bypass evidence (BP-P2-002 /
 * BP-P2-003).
 *
 * mode=drift
 *   Compares the committed payloads in `.github/branch-protection/*.json` with
 *   the live GitHub branch protection, normalized to the committed shape.
 *   Exits 1 when a branch drifts or has no protection at all, and writes both
 *   sides (raw + normalized) plus a diff per branch when --report-dir is set.
 *   The protection read needs `administration: read`, which the default
 *   GITHUB_TOKEN does not have: set BRANCH_PROTECTION_TOKEN (or GH_TOKEN when
 *   running locally with an admin token).
 *
 * mode=bypass
 *   Lists PRs merged into the protected branches inside the lookback window and
 *   flags merges whose head-SHA check-runs did not satisfy every required
 *   context that was live on the branch (missing or not
 *   success/neutral/skipped). This is the machine half of the break-glass
 *   audit trail (docs/RUNBOOK_EMERGENCY_MERGE.md): every flagged bypass needs a
 *   `[break-glass]` record issue, which the workflow opens.
 *
 * Fixture mode (used by scripts/ci/check-branch-protection-audit.sh):
 *   --live-dir <dir>        read live-shaped `<branch>.json` files instead of
 *                           calling the protection API (missing file = branch
 *                           not protected)
 *   --prs-file <path>       merged-PR list instead of GET /repos/.../pulls
 *   --check-runs-dir <dir>  `<sha>.json` check-run responses instead of the API
 *
 * Usage:
 *   GH_TOKEN=<admin token> node scripts/branch-protection-audit.mjs \
 *     --mode drift --repo MaineCyberTech/mainecybertech
 *   node scripts/branch-protection-audit.mjs --mode bypass --repo owner/repo \
 *     --lookback-days 14 --report-dir branch-protection-audit/bypass
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
function argValue(name, fallback) {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  if (i !== -1 && i + 1 < args.length && !args[i + 1].startsWith("--")) {
    return args[i + 1];
  }
  return fallback;
}

const MODE = argValue("mode", "");
const REPO = argValue("repo", process.env.GITHUB_REPOSITORY ?? "");
const BP_DIR = argValue("branch-protection-dir", ".github/branch-protection");
const LIVE_DIR = argValue("live-dir", "");
const PRS_FILE = argValue("prs-file", "");
const CHECK_RUNS_DIR = argValue("check-runs-dir", "");
const LOOKBACK_DAYS = Number(argValue("lookback-days", "14"));
const MAX_PAGES = Number(argValue("max-pages", "5"));
const REPORT_DIR = argValue("report-dir", "");
const API_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const PROTECTION_TOKEN = process.env.BRANCH_PROTECTION_TOKEN || API_TOKEN;

const API = "https://api.github.com";
/** GitHub treats a skipped job as success for required checks. */
const ACCEPTED_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);

if (MODE !== "drift" && MODE !== "bypass") {
  console.error("usage: branch-protection-audit.mjs --mode drift|bypass [options]");
  process.exit(2);
}
if (!REPO && MODE === "bypass") {
  console.error("error: --repo (or GITHUB_REPOSITORY) is required");
  process.exit(2);
}
if (MODE === "bypass" && (PRS_FILE || CHECK_RUNS_DIR) && !(PRS_FILE && CHECK_RUNS_DIR)) {
  console.error("error: fixture mode needs both --prs-file and --check-runs-dir");
  process.exit(2);
}

async function apiGet(path, token, { allow404 = false } = {}) {
  if (!token) {
    throw new Error(
      "no API token: set GH_TOKEN (or GITHUB_TOKEN), and BRANCH_PROTECTION_TOKEN " +
        "for the branch-protection read",
    );
  }
  const url = path.startsWith("http") ? path : `${API}/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "branch-protection-audit",
    },
  });
  if (res.status === 404 && allow404) return { status: 404, body: null, link: null };
  if (!res.ok) {
    const text = (await res.text()).slice(0, 300);
    throw new Error(`GitHub API ${res.status} for ${path}: ${text}`);
  }
  return {
    status: res.status,
    body: await res.json(),
    link: res.headers.get("link"),
  };
}

function nextPageUrl(link) {
  if (!link) return null;
  const match = /<([^>]+)>;\s*rel="next"/.exec(link);
  return match ? match[1] : null;
}

/** Committed `*.json` basenames are the branches this repo protects. */
async function listBranches() {
  const files = (await readdir(BP_DIR)).filter((f) => f.endsWith(".json"));
  return files.map((f) => f.replace(/\.json$/, "")).sort();
}

async function readLiveProtection(branch) {
  if (LIVE_DIR) {
    try {
      const raw = JSON.parse(await readFile(join(LIVE_DIR, `${branch}.json`), "utf8"));
      if (raw && raw.message) return { protected: false, raw: null };
      return { protected: true, raw };
    } catch (error) {
      if (error.code === "ENOENT") return { protected: false, raw: null };
      throw error;
    }
  }
  let status;
  let body;
  try {
    ({ status, body } = await apiGet(
      `repos/${REPO}/branches/${branch}/protection`,
      PROTECTION_TOKEN,
      { allow404: true },
    ));
  } catch (error) {
    throw new Error(
      `cannot read branch protection for ${branch}: ${error.message}. Classic ` +
        "branch protection needs a token with `administration: read` — set " +
        "BRANCH_PROTECTION_READ_TOKEN (the default GITHUB_TOKEN cannot read it)",
    );
  }
  if (status === 404) {
    // Distinguish "not protected" from "token cannot read protection": the
    // repo payload reports the token's admin bit.
    const repo = await apiGet(`repos/${REPO}`, API_TOKEN).catch(() => null);
    if (repo?.body?.permissions?.admin !== true) {
      throw new Error(
        `cannot read branch protection for ${branch} (404): either the branch is ` +
          "not protected or the token lacks `administration: read`. Set " +
          "BRANCH_PROTECTION_READ_TOKEN to a token with it (the default " +
          "GITHUB_TOKEN cannot read classic branch protection)",
      );
    }
    return { protected: false, raw: null };
  }
  return { protected: true, raw: body };
}

/** Live API response -> the shape the committed JSON uses. */
function normalizeLive(live) {
  const rsc = live.required_status_checks ?? null;
  const reviews = live.required_pull_request_reviews ?? null;
  return {
    required_status_checks:
      rsc === null
        ? null
        : { strict: rsc.strict === true, contexts: [...(rsc.contexts ?? [])] },
    enforce_admins: live.enforce_admins?.enabled === true,
    required_pull_request_reviews:
      reviews === null
        ? null
        : {
            dismiss_stale_reviews: reviews.dismiss_stale_reviews === true,
            require_code_owner_reviews: reviews.require_code_owner_reviews === true,
            required_approving_review_count: reviews.required_approving_review_count ?? 0,
          },
    restrictions: live.restrictions ?? null,
    required_conversation_resolution:
      live.required_conversation_resolution?.enabled === true,
    allow_force_pushes: live.allow_force_pushes?.enabled === true,
    allow_deletions: live.allow_deletions?.enabled === true,
  };
}

/** Committed payload -> the same shape (defaults mirror the API's defaults). */
function normalizeCommitted(committed) {
  const rsc = committed.required_status_checks ?? null;
  const reviews = committed.required_pull_request_reviews ?? null;
  return {
    required_status_checks:
      rsc === null
        ? null
        : { strict: rsc.strict === true, contexts: [...(rsc.contexts ?? [])] },
    enforce_admins: committed.enforce_admins === true,
    required_pull_request_reviews:
      reviews === null
        ? null
        : {
            dismiss_stale_reviews: reviews.dismiss_stale_reviews === true,
            require_code_owner_reviews: reviews.require_code_owner_reviews === true,
            required_approving_review_count: reviews.required_approving_review_count ?? 0,
          },
    restrictions: committed.restrictions ?? null,
    required_conversation_resolution:
      committed.required_conversation_resolution === true,
    allow_force_pushes: committed.allow_force_pushes === true,
    allow_deletions: committed.allow_deletions === true,
  };
}

/** Human-readable differences between the committed and live shapes. */
function diffProtection(expected, live) {
  const diffs = [];
  const expRsc = expected.required_status_checks;
  const liveRsc = live.required_status_checks;
  if (expRsc === null || liveRsc === null) {
    if (expRsc !== liveRsc) {
      diffs.push(
        `required_status_checks: committed ${expRsc === null ? "none" : "present"} ` +
          `vs live ${liveRsc === null ? "none" : "present"}`,
      );
    }
  } else {
    if (expRsc.strict !== liveRsc.strict) {
      diffs.push(
        `required_status_checks.strict: committed ${expRsc.strict} vs live ${liveRsc.strict}`,
      );
    }
    const expContexts = new Set(expRsc.contexts);
    const liveContexts = new Set(liveRsc.contexts);
    for (const ctx of [...expContexts].filter((c) => !liveContexts.has(c)).sort()) {
      diffs.push(`context required in the committed JSON but not live: "${ctx}"`);
    }
    for (const ctx of [...liveContexts].filter((c) => !expContexts.has(c)).sort()) {
      diffs.push(`context required live but not in the committed JSON: "${ctx}"`);
    }
  }

  for (const key of [
    "enforce_admins",
    "required_conversation_resolution",
    "allow_force_pushes",
    "allow_deletions",
  ]) {
    if (expected[key] !== live[key]) {
      diffs.push(`${key}: committed ${expected[key]} vs live ${live[key]}`);
    }
  }

  const expReviews = expected.required_pull_request_reviews;
  const liveReviews = live.required_pull_request_reviews;
  if (expReviews === null || liveReviews === null) {
    if (expReviews !== liveReviews) {
      diffs.push(
        `required_pull_request_reviews: committed ${expReviews === null ? "none" : "present"} ` +
          `vs live ${liveReviews === null ? "none" : "present"}`,
      );
    }
  } else {
    for (const key of [
      "dismiss_stale_reviews",
      "require_code_owner_reviews",
      "required_approving_review_count",
    ]) {
      if (expReviews[key] !== liveReviews[key]) {
        diffs.push(
          `required_pull_request_reviews.${key}: committed ${expReviews[key]} ` +
            `vs live ${liveReviews[key]}`,
        );
      }
    }
  }

  if (JSON.stringify(expected.restrictions) !== JSON.stringify(live.restrictions)) {
    diffs.push(
      `restrictions: committed ${JSON.stringify(expected.restrictions)} ` +
        `vs live ${JSON.stringify(live.restrictions)}`,
    );
  }
  return diffs;
}

/** Live protections the committed payload does not encode (warning only). */
function liveExtras(raw) {
  const extras = [];
  const flag = (name, enabled) => {
    if (enabled === true) extras.push(name);
  };
  flag("required_linear_history", raw?.required_linear_history?.enabled);
  flag("block_creations", raw?.block_creations?.enabled);
  flag("lock_branch", raw?.lock_branch?.enabled);
  flag("allow_fork_syncing", raw?.allow_fork_syncing?.enabled);
  flag("required_signatures", raw?.required_signatures?.enabled);
  return extras;
}

async function writeReport(name, data) {
  if (!REPORT_DIR) return;
  await mkdir(REPORT_DIR, { recursive: true });
  const text = typeof data === "string" ? data : `${JSON.stringify(data, null, 2)}\n`;
  await writeFile(join(REPORT_DIR, name), text, "utf8");
}

async function runDrift() {
  const branches = await listBranches();
  if (!branches.length) throw new Error(`no *.json files under ${BP_DIR}`);
  const summary = [];
  let failures = 0;

  for (const branch of branches) {
    const committed = JSON.parse(await readFile(join(BP_DIR, `${branch}.json`), "utf8"));
    const expected = normalizeCommitted(committed);
    const { protected: isProtected, raw } = await readLiveProtection(branch);

    if (!isProtected) {
      failures++;
      console.error(`DRIFT ${branch}: no branch protection is configured live`);
      summary.push({ branch, status: "unprotected", diffs: ["no live protection"] });
      await writeReport(`drift-${branch}.diff.txt`, "no branch protection configured live\n");
      await writeReport(`drift-${branch}.committed.json`, expected);
      await writeReport(`drift-${branch}.live.json`, null);
      continue;
    }

    const live = normalizeLive(raw);
    const diffs = diffProtection(expected, live);
    const extras = liveExtras(raw);

    if (diffs.length) {
      failures++;
      console.error(`DRIFT ${branch}: committed JSON and live settings differ:`);
      for (const d of diffs) console.error(`  - ${d}`);
    } else {
      console.log(`OK    ${branch}: live settings match the committed JSON`);
    }
    if (extras.length) {
      console.warn(
        `WARN  ${branch}: live protections not encoded in the committed JSON: ` +
          extras.join(", "),
      );
    }

    summary.push({ branch, status: diffs.length ? "drift" : "match", diffs, extras });
    await writeReport(`drift-${branch}.diff.txt`, diffs.length ? `${diffs.join("\n")}\n` : "match\n");
    await writeReport(`drift-${branch}.committed.json`, expected);
    await writeReport(`drift-${branch}.live.json`, raw);
    await writeReport(`drift-${branch}.live.normalized.json`, live);
  }

  await writeReport("drift-summary.json", {
    generated_at: new Date().toISOString(),
    repo: REPO,
    branches: summary,
  });

  if (failures > 0) {
    console.error(
      `\nFAIL: ${failures} branch(es) drifted from .github/branch-protection/*.json. ` +
        "Reconcile the live settings (apply the committed JSON) or update the " +
        "committed JSON in a reviewed PR — see .github/branch-protection/README.md.",
    );
    process.exit(1);
  }
  console.log(`\nPASS: ${branches.length} branch(es) match the committed protection.`);
}

function filterPrs(prs, since, branches) {
  return prs.filter(
    (pr) =>
      pr.merged_at &&
      new Date(pr.merged_at) >= since &&
      branches.includes(pr.base?.ref),
  );
}

async function fetchMergedPrs(since, branches) {
  if (PRS_FILE) {
    return filterPrs(JSON.parse(await readFile(PRS_FILE, "utf8")), since, branches);
  }
  const prs = [];
  let url =
    `${API}/repos/${REPO}/pulls?state=closed&sort=updated&direction=desc&per_page=100`;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res = await apiGet(url, API_TOKEN);
    prs.push(...filterPrs(res.body, since, branches));
    url = nextPageUrl(res.link);
  }
  return prs;
}

async function fetchCheckRuns(sha) {
  if (CHECK_RUNS_DIR) {
    const body = JSON.parse(
      await readFile(join(CHECK_RUNS_DIR, `${sha}.json`), "utf8"),
    );
    return body.check_runs ?? [];
  }
  const runs = [];
  let url = `${API}/repos/${REPO}/commits/${sha}/check-runs?filter=latest&per_page=100`;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res = await apiGet(url, API_TOKEN);
    runs.push(...(res.body.check_runs ?? []));
    url = nextPageUrl(res.link);
  }
  return runs;
}

async function runBypass() {
  const branches = await listBranches();
  if (!branches.length) throw new Error(`no *.json files under ${BP_DIR}`);

  const requiredByBranch = new Map();
  for (const branch of branches) {
    const { protected: isProtected, raw } = await readLiveProtection(branch);
    if (!isProtected) {
      console.warn(`WARN  ${branch}: no live protection — nothing can bypass it`);
      requiredByBranch.set(branch, []);
      continue;
    }
    requiredByBranch.set(branch, raw.required_status_checks?.contexts ?? []);
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const prs = await fetchMergedPrs(since, branches);
  const bypasses = [];

  for (const pr of prs) {
    const contexts = requiredByBranch.get(pr.base.ref) ?? [];
    if (!contexts.length) continue;
    const runs = await fetchCheckRuns(pr.head.sha);
    const latest = new Map();
    for (const run of runs) latest.set(run.name, run);

    const missing = contexts.filter((ctx) => !latest.has(ctx));
    const failing = contexts
      .filter((ctx) => latest.has(ctx) && !ACCEPTED_CONCLUSIONS.has(latest.get(ctx).conclusion))
      .map((ctx) => ({
        context: ctx,
        conclusion: latest.get(ctx).conclusion ?? "incomplete",
      }));
    if (!missing.length && !failing.length) continue;

    bypasses.push({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      branch: pr.base.ref,
      head_sha: pr.head.sha,
      merged_at: pr.merged_at,
      missing_contexts: missing,
      failing_checks: failing,
    });
  }

  const report = {
    generated_at: new Date().toISOString(),
    repo: REPO,
    lookback_days: LOOKBACK_DAYS,
    branches,
    prs_checked: prs.length,
    bypasses,
  };
  await writeReport("bypass.json", report);

  for (const bypass of bypasses) {
    const detail = [
      ...bypass.missing_contexts.map((ctx) => `missing "${ctx}"`),
      ...bypass.failing_checks.map((c) => `"${c.context}" ${c.conclusion}`),
    ].join(", ");
    console.error(
      `BYPASS #${bypass.number} (${bypass.branch}): ${detail} — ${bypass.url}`,
    );
  }

  if (bypasses.length) {
    console.error(
      `\nFAIL: ${bypasses.length} merged PR(s) bypassed a required check. Every bypass ` +
        "needs a [break-glass] record — see docs/RUNBOOK_EMERGENCY_MERGE.md.",
    );
    process.exit(1);
  }
  console.log(
    `\nPASS: ${prs.length} merged PR(s) in the last ${LOOKBACK_DAYS} day(s) ` +
      "satisfied every required check.",
  );
}

const run = MODE === "drift" ? runDrift : runBypass;
run().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(2);
});
