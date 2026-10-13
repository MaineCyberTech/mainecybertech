#!/usr/bin/env node
/**
 * CODEOWNERS guard (BP-P3-005).
 *
 * `require_code_owner_reviews: true` in .github/branch-protection/*.json is
 * only as strong as the owner map: a syntax typo or a team handle that does
 * not exist makes GitHub silently fall back to "no owner" for that path, and
 * the review requirement stops applying. This guard:
 *
 *   1. parses .github/CODEOWNERS and fails on syntax errors (a rule with no
 *      owners, an owner that is not `@user` / `@org/team`, no catch-all `*`
 *      rule, no rules at all);
 *   2. resolves every `@org/team` handle against the GitHub API when a token
 *      is configured (fine-grained PAT with Organization -> Members: read),
 *      so an invalid handle fails the build instead of disabling enforcement.
 *
 * The API half is opt-in and documented as the fallback: without a token the
 * guard validates syntax only and prints a notice. Enable it by exporting
 * CODEOWNERS_READ_TOKEN (or passing --verify-api with GH_TOKEN/GITHUB_TOKEN).
 *
 * Usage:
 *   node scripts/check-codeowners.mjs
 *   node scripts/check-codeowners.mjs --codeowners <path> --verify-api \
 *     --teams-file <fixture.json>       # offline team list for self-tests
 */

import { readFileSync } from "node:fs";
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

const CODEOWNERS_PATH = argValue("codeowners", ".github/CODEOWNERS");
const TEAMS_FILE = argValue("teams-file", "");
const TOKEN =
  process.env.CODEOWNERS_READ_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN || "";
const VERIFY_API =
  args.includes("--verify-api") || process.env.CODEOWNERS_VERIFY_API === "1";

const USER_RE = /^@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const TEAM_RE = /^@([A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)\/([A-Za-z0-9._-]+)$/;

let text;
try {
  text = readFileSync(CODEOWNERS_PATH, "utf8");
} catch (error) {
  console.error(`error: cannot read ${CODEOWNERS_PATH}: ${error.message}`);
  process.exit(2);
}

const failures = [];
const rules = [];
const teams = new Map(); // "org/team" -> first line that referenced it

text.split(/\r?\n/).forEach((raw, index) => {
  const line = index + 1;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("#")) return;

  const parts = trimmed.split(/\s+/);
  const pattern = parts[0];
  const owners = parts.slice(1);

  if (!pattern) {
    failures.push(`line ${line}: rule has no pattern`);
    return;
  }
  if (owners.length === 0) {
    failures.push(`line ${line}: "${pattern}" has no owners`);
    return;
  }
  if (pattern.includes("..")) {
    failures.push(`line ${line}: pattern "${pattern}" must not contain ".."`);
  }
  for (const owner of owners) {
    const teamMatch = TEAM_RE.exec(owner);
    if (teamMatch) {
      const key = `${teamMatch[1]}/${teamMatch[2]}`;
      if (!teams.has(key)) teams.set(key, line);
      continue;
    }
    if (USER_RE.test(owner)) continue;
    failures.push(
      `line ${line}: owner "${owner}" is not a valid @user or @org/team handle`,
    );
  }
  rules.push({ line, pattern, owners });
});

if (rules.length === 0) {
  failures.push(`${CODEOWNERS_PATH} contains no owner rules`);
}
if (rules.length > 0 && !rules.some((rule) => rule.pattern === "*")) {
  failures.push(
    `${CODEOWNERS_PATH} has no catch-all "*" rule — paths outside the mapped directories have no owner`,
  );
}

/** Resolve team handles via the API (or the offline fixture list). */
async function verifyTeams() {
  let existing = null;
  if (TEAMS_FILE) {
    try {
      const parsed = JSON.parse(readFileSync(TEAMS_FILE, "utf8"));
      const list = Array.isArray(parsed) ? parsed : parsed.teams;
      existing = new Set(list);
    } catch (error) {
      console.error(`error: cannot read teams fixture ${TEAMS_FILE}: ${error.message}`);
      process.exit(2);
    }
  } else if (!VERIFY_API) {
    console.log(
      "teams: syntax-only (no CODEOWNERS_READ_TOKEN/--verify-api) — set a token with Organization -> Members: read to resolve handles via the API",
    );
    return;
  }

  for (const [team, line] of teams) {
    if (existing) {
      if (!existing.has(team)) {
        failures.push(`line ${line}: team @${team} does not exist in the teams fixture`);
      } else {
        console.log(`  OK      @${team} (fixture)`);
      }
      continue;
    }
    if (!TOKEN) {
      console.error(
        "error: --verify-api was requested but no token is available (CODEOWNERS_READ_TOKEN / GH_TOKEN / GITHUB_TOKEN)",
      );
      process.exit(2);
    }
    const [org, slug] = team.split("/");
    const res = await fetch(`https://api.github.com/orgs/${org}/teams/${slug}`, {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${TOKEN}`,
        "user-agent": "mct-codeowners-check/1.0",
      },
    });
    if (res.status === 200) {
      console.log(`  OK      @${team}`);
    } else if (res.status === 404) {
      failures.push(`line ${line}: team @${team} does not exist (HTTP 404)`);
    } else {
      const body = await res.text().catch(() => "");
      failures.push(
        `line ${line}: could not verify @${team} (HTTP ${res.status}) — the token needs Organization -> Members: read. ${body.slice(0, 200)}`,
      );
    }
  }
}

await verifyTeams();

if (failures.length > 0) {
  console.error(`\nFAIL: ${failures.length} CODEOWNERS problem(s):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `\nPASS: ${rules.length} rule(s), ${teams.size} team handle(s) checked (${CODEOWNERS_PATH})`,
);
