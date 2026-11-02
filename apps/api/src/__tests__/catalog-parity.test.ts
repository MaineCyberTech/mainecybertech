import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { MODULE_REGISTRY } from "@mct/sdk/module-registry";
// The web app mirrors the MSP staff role gate; importing it makes the parity
// assertion value-based instead of a text match.
import { PLATFORM_ADMIN_KEYS as WEB_PLATFORM_ADMIN_KEYS } from "../../../../apps/web/lib/roles";

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import {
  CROSS_TENANT_KEYS,
  ELEVATED_TENANT_KEYS,
  PLATFORM_ADMIN_KEYS,
} from "../lib/roles";
import {
  DEFAULT_ENABLED_MODULES,
  SUBSCRIPTION_ENABLED_MODULES,
} from "../lib/entitlements";
import { ANALYTICS_EVENT_NAMES } from "../lib/analytics-events";

/**
 * EVOL-P3-008: roles, plan-to-module mapping and status vocabularies are
 * hardcoded across the API/web/migrations with no parity guard. These tests
 * compare each hardcoded catalog with the source it must match, so drift fails
 * CI instead of shipping.
 *
 * The module/plan mapping is already guarded by module-registry.test.ts
 * (registry <-> 5302118 + entitlement tiers); this suite re-asserts the tier
 * derivation so the plan mapping is covered in one place with roles/statuses.
 */

const MIGRATIONS = path.join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
const ROLES_BOOTSTRAP = path.join(
  MIGRATIONS,
  "5302026_supabase_consolidated_fresh_bootstrap_20260529.corrected.v3.sql",
);
const ROLES_EXPANSION = path.join(MIGRATIONS, "5302128_role_catalog_expansion.sql");
const STATUS_CHECKS = path.join(MIGRATIONS, "5302457_status_check_constraints.sql");
const SOP_STATUS_CHECK = path.join(MIGRATIONS, "5302462_sop_library_status_check.sql");
const VALIDATORS = path.join(__dirname, "..", "validators");
const WEB_ANALYTICS_EVENTS = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "apps",
  "web",
  "lib",
  "catalog",
  "data",
  "analytics-events.json",
);

function quotedValues(block: string): string[] {
  return [...block.matchAll(/'([^']+)'/g)].map((match) => match[1]);
}

function catalogRoleKeys(): string[] {
  const keys = new Set<string>();
  for (const file of [ROLES_BOOTSTRAP, ROLES_EXPANSION]) {
    const sql = fs.readFileSync(file, "utf8");
    for (const statement of sql.matchAll(/insert\s+into\s+public\.roles\b(.*?);/gs)) {
      // Role rows start with a uuid (expansion) or the key itself (bootstrap).
      for (const row of statement[1].matchAll(/\(([^()]*)\)/g)) {
        const values = quotedValues(row[1]);
        const key = values.find((value) => /^[a-z][a-z0-9_-]*$/.test(value));
        if (key) keys.add(key);
      }
    }
  }
  return [...keys].sort();
}

/** table -> DB status vocabulary from the CHECK-constraint migrations. */
function dbStatusVocabularies(): Map<string, string[]> {
  const vocab = new Map<string, string[]>();
  for (const file of [STATUS_CHECKS, SOP_STATUS_CHECK]) {
    const sql = fs.readFileSync(file, "utf8");
    for (const match of sql.matchAll(
      /\('([a-z_]+)',\s*'[a-z_]+',\s*'status',\s*array\[([^\]]*)\]\)/g,
    )) {
      vocab.set(match[1], quotedValues(match[2]));
    }
  }
  return vocab;
}

/**
 * First `status: z.enum([...])` in a validator file, or a `z.enum(NAME)`
 * reference resolved against an `export const NAME = [...]` in the same file
 * (DATA-P3-007 moved sop_library's vocabulary to a named constant).
 */
function validatorStatusValues(file: string): string[] {
  const src = fs.readFileSync(path.join(VALIDATORS, file), "utf8");
  const inline = src.match(/status:\s*z\.enum\(\[([^\]]*)\]\)/);
  if (inline) return quotedValues(inline[1]);
  const named = src.match(/status:\s*z\.enum\((\w+)\)/);
  if (named) {
    const declaration = src.match(new RegExp(`const\\s+${named[1]}\\s*=\\s*\\[([^\\]]*)\\]`));
    if (!declaration) throw new Error(`${file}: ${named[1]} array not found`);
    return quotedValues(declaration[1]);
  }
  throw new Error(`${file}: status z.enum not found`);
}

describe("catalog parity (EVOL-P3-008)", () => {
  describe("roles", () => {
    it("keeps the API role tiers inside the migration catalog", () => {
      const catalog = new Set(catalogRoleKeys());
      for (const key of PLATFORM_ADMIN_KEYS) {
        expect(catalog.has(key)).toBe(true);
      }
      // The catalog is a superset: client roles are intentionally not part of
      // the MSP platform-admin tiers.
      expect(catalog.has("client_user")).toBe(true);
      expect(catalog.has("client_admin")).toBe(true);
    });

    it("keeps the cross-tenant and elevated tiers disjoint", () => {
      const cross = new Set<string>(CROSS_TENANT_KEYS);
      const overlap = ELEVATED_TENANT_KEYS.filter((key) => cross.has(key));
      expect(overlap).toEqual([]);
    });

    it("matches the web app's platform-admin gate exactly", () => {
      expect([...WEB_PLATFORM_ADMIN_KEYS].sort()).toEqual([...PLATFORM_ADMIN_KEYS].sort());
    });
  });

  describe("plan-to-module mapping", () => {
    it("derives the default/subscription tiers from the module registry", () => {
      const modules = Object.values(MODULE_REGISTRY);
      const defaultTier = modules
        .filter((module) => module.entitlement === "default")
        .map((module) => module.key);
      const subscriptionTier = modules
        .filter((module) => module.entitlement === "subscription")
        .map((module) => module.key);
      expect(DEFAULT_ENABLED_MODULES).toEqual(defaultTier);
      expect(SUBSCRIPTION_ENABLED_MODULES).toEqual([...defaultTier, ...subscriptionTier]);
    });
  });

  describe("status vocabularies", () => {
    const STATUS_TABLES = [
      ["assets", "assets.ts"],
      ["findings", "findings.ts"],
      ["proposals", "proposals.ts"],
      ["domain_monitors", "domain-monitors.ts"],
      ["cab_meetings", "cab.ts"],
      ["file_requests", "file-requests.ts"],
      ["qbr_reports", "qbr.ts"],
      ["approval_requests", "approvals.ts"],
      ["satisfaction_pulses", "satisfaction-pulse-widget.ts"],
      // DATA-P3-007: the governance SOP status was free text; the validator
      // enum and the 5302462 CHECK now share one vocabulary.
      ["sop_library", "governance.ts"],
    ] as const;

    it("constrains every app-enforced status vocabulary at the DB level", () => {
      const db = dbStatusVocabularies();
      for (const [table, validator] of STATUS_TABLES) {
        const allowed = db.get(table);
        expect(allowed).toBeDefined();
        const written = validatorStatusValues(validator);
        const unknown = written.filter((value) => !allowed!.includes(value));
        expect({ table, validator, unknown }).toEqual({ table, validator, unknown: [] });
      }
    });
  });

  describe("analytics event registry", () => {
    it("keeps the API event allowlist in sync with the web registry (AN-P3-006)", () => {
      const web = JSON.parse(fs.readFileSync(WEB_ANALYTICS_EVENTS, "utf8")) as {
        eventNames: string[];
      };
      expect([...ANALYTICS_EVENT_NAMES].sort()).toEqual([...web.eventNames].sort());
    });
  });
});
