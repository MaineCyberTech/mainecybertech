#!/usr/bin/env node
/**
 * CHANGELOG checkbox guard (REL-P3-002).
 *
 * The PR template has a `CHANGELOG.md` checkbox, but nothing verified it: a PR
 * touching product code could merge with the box unchecked and the
 * `[Unreleased]` section silently missing its entry. This guard fails a PR when
 * it changes a user-visible path and the checkbox is not checked.
 *
 * It is intentionally conservative about what counts as user-visible (product
 * source and migrations, never tests/e2e/stories/docs/config), so a docs-only or
 * test-only PR passes without a CHANGELOG entry. It does not inspect the
 * CHANGELOG diff itself; the checkbox is the reviewed declaration.
 *
 * Usage (CI passes the PR body as PR_BODY and the changed-file list):
 *   node scripts/check-changelog-checkbox.mjs --files changed-files.txt
 *   node scripts/check-changelog-checkbox.mjs --self-test
 */
import { readFileSync } from "node:fs";

const USER_VISIBLE = [
  /^apps\/api\/src\//,
  /^apps\/worker\/src\//,
  /^apps\/web\/(app|components|lib|hooks|styles|public)\//,
  /^packages\/(sdk|ui)\/src\//,
  /^supabase\/migrations\/[^/]+\.sql$/,
];

const NON_PRODUCT = [
  /(^|\/)(__tests__|e2e|stories)\//,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /\.stories\.[cm]?[jt]sx?$/,
  /\.mdx?$/,
];

export function isUserVisible(file) {
  const normalized = file.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized) return false;
  if (NON_PRODUCT.some((pattern) => pattern.test(normalized))) return false;
  return USER_VISIBLE.some((pattern) => pattern.test(normalized));
}

/**
 * Returns "checked", "unchecked", or "missing" for the CHANGELOG checkbox in a
 * PR body. More than one matching box is tolerated; any checked one passes.
 */
export function changelogCheckboxState(body) {
  const items = [...body.matchAll(/^\s*[-*]\s*\[([ xX])\]\s*(.*)$/gm)];
  const matches = items.filter((match) => /CHANGELOG\.md/i.test(match[2]));
  if (matches.length === 0) return "missing";
  return matches.some((match) => match[1].toLowerCase() === "x") ? "checked" : "unchecked";
}

function selfTest() {
  const cases = [
    ["apps/api/src/routes/audit.ts", true],
    ["apps/web/app/(portal)/page.tsx", true],
    ["apps/worker/src/main.ts", true],
    ["packages/sdk/src/organizations.ts", true],
    ["packages/ui/src/button.tsx", true],
    ["supabase/migrations/5302463_next.sql", true],
    ["apps/api/src/routes/audit.test.ts", false],
    ["apps/api/src/__tests__/audit.ts", false],
    ["apps/web/e2e/a11y.spec.ts", false],
    ["apps/web/components/button.stories.tsx", false],
    ["docs/RELEASING.md", false],
    ["package.json", false],
    ["pnpm-lock.yaml", false],
  ];
  for (const [file, expected] of cases) {
    const actual = isUserVisible(file);
    if (actual !== expected) {
      throw new Error(`self-test: isUserVisible(${file}) = ${actual}, expected ${expected}`);
    }
  }
  const body = (state) => `- [${state}] \`CHANGELOG.md\` \`[Unreleased]\` updated\n`;
  if (changelogCheckboxState(body("x")) !== "checked") throw new Error("self-test: checked body");
  if (changelogCheckboxState(body(" ")) !== "unchecked")
    throw new Error("self-test: unchecked body");
  if (changelogCheckboxState("## Summary\n") !== "missing")
    throw new Error("self-test: missing body");
  console.log(`changelog checkbox guard self-test OK (${cases.length} path cases)`);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function main() {
  if (process.argv.includes("--self-test")) {
    selfTest();
    return;
  }

  const filesPath = arg("--files");
  if (!filesPath) {
    console.error("usage: check-changelog-checkbox.mjs --files <changed-files.txt> | --self-test");
    process.exit(2);
  }

  // Only the PR gate supplies a body. Local runs / deploy gates without a PR
  // context skip instead of failing (there is nothing to check off).
  const body = process.env.PR_BODY;
  if (body === undefined) {
    console.log("changelog checkbox guard skipped (no PR_BODY)");
    return;
  }

  const changed = readFileSync(filesPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const visible = changed.filter(isUserVisible);
  if (visible.length === 0) {
    console.log("changelog checkbox guard OK (no user-visible paths changed)");
    return;
  }

  const state = changelogCheckboxState(body);
  if (state === "checked") {
    console.log(`changelog checkbox guard OK (${visible.length} user-visible file(s))`);
    return;
  }

  console.error(
    `CHANGELOG checkbox ${state === "missing" ? "missing" : "unchecked"} in the PR body, ` +
      `but this PR changes ${visible.length} user-visible file(s):`,
  );
  for (const file of visible.slice(0, 20)) console.error(`  ${file}`);
  if (visible.length > 20) console.error(`  … and ${visible.length - 20} more`);
  console.error(
    "Tick `- [x] CHANGELOG.md [Unreleased] updated` (or use the docs-only N/A path) " +
      "in .github/PULL_REQUEST_TEMPLATE.md.",
  );
  process.exit(1);
}

main();
