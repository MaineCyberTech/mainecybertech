import * as fs from "fs";
import * as path from "path";

/**
 * PRIV-P2-003 — policy-vs-code retention guard.
 *
 * The published privacy policy promised three years for contact-form
 * submissions while the worker purges `public_interactions` after 90 days.
 * This guard reads both sources and fails when they drift apart, so the next
 * change to the worker constant or the policy text cannot silently
 * re-introduce the mismatch.
 */

const REPO_ROOT = path.join(__dirname, "..", "..", "..", "..");
const PRIVACY_PAGE = path.join(
  REPO_ROOT,
  "apps",
  "web",
  "app",
  "(public)",
  "privacy",
  "page.tsx",
);
const RETENTION_TASK = path.join(
  REPO_ROOT,
  "apps",
  "worker",
  "src",
  "tasks",
  "public-interaction-retention.ts",
);
const MAIN_RETENTION_TASK = path.join(
  REPO_ROOT,
  "apps",
  "worker",
  "src",
  "tasks",
  "retention.ts",
);

describe("contact-form retention policy alignment (PRIV-P2-003)", () => {
  it("publishes the same retention window the worker enforces", () => {
    const task = fs.readFileSync(RETENTION_TASK, "utf8");
    const match = task.match(/const (?:DEFAULT_)?RETENTION_DAYS = (\d+)/);
    if (!match) {
      throw new Error(`RETENTION_DAYS not found in ${RETENTION_TASK}`);
    }
    const retentionDays = Number(match[1]);
    expect(retentionDays).toBeGreaterThan(0);

    const page = fs.readFileSync(PRIVACY_PAGE, "utf8");
    expect(page).toContain(`${retentionDays} days`);
  });

  it("discloses that forwarded Teams/JSM copies are outside the purge", () => {
    const page = fs.readFileSync(PRIVACY_PAGE, "utf8");
    expect(page).toContain("Microsoft Teams");
    expect(page).toContain("JSM");
  });

  it("publishes the same store-quote retention window the worker enforces (PRIV-P2-008)", () => {
    const task = fs.readFileSync(MAIN_RETENTION_TASK, "utf8");
    const match = task.match(/storeQuoteRetentionDays: (\d+)/);
    if (!match) {
      throw new Error(`storeQuoteRetentionDays not found in ${MAIN_RETENTION_TASK}`);
    }
    const retentionDays = Number(match[1]);
    expect(retentionDays).toBeGreaterThan(0);

    const page = fs.readFileSync(PRIVACY_PAGE, "utf8");
    const quoteSentence = page.match(/Store quote requests[\s\S]*?after (\d+) days/);
    expect(quoteSentence?.[1]).toBe(String(retentionDays));
  });
});
