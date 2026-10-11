import { jest } from "@jest/globals";
import fs from "fs";
import path from "path";
import { MODULE_REGISTRY } from "@mct/sdk/module-registry";

jest.mock("../services/supabase", () => ({
  getSupabaseAdmin: jest.fn(),
}));

import {
  DEFAULT_ENABLED_MODULES,
  GATED_MODULES,
  SUBSCRIPTION_ENABLED_MODULES,
} from "../lib/entitlements";

/**
 * EVOL-P2-001: the shared module registry is the single source of truth for
 * module identity. These guards fail CI when the permission-catalog migration
 * and the registry drift apart, or when the entitlement tiers stop being
 * derived from the registry.
 */

const MIGRATION = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "supabase",
  "migrations",
  "5302118_permission_matrix_full_catalog.sql",
);

function catalogPermissionPairs(): string[] {
  const sql = fs.readFileSync(MIGRATION, "utf8");
  // The module permission seed is everything before the role assignments.
  const permissionsSection = sql.split("insert into public.role_permissions")[0];
  const pairs = new Set<string>();
  for (const row of permissionsSection.matchAll(/\(([^()]*)\)/g)) {
    const parts = [...row[1].matchAll(/'([^']*)'/g)].map((match) => match[1]);
    if (parts.length >= 2) pairs.add(`${parts[0]}:${parts[1]}`);
  }
  return [...pairs].sort();
}

describe("module registry (EVOL-P2-001)", () => {
  it("matches the permission catalog migration exactly", () => {
    const catalog = catalogPermissionPairs();
    const registry = Object.values(MODULE_REGISTRY)
      .flatMap((module) => module.permissions)
      .sort();
    expect(registry).toEqual(catalog);

    const catalogModules = [...new Set(catalog.map((key) => key.split(":")[0]))].sort();
    expect(Object.keys(MODULE_REGISTRY).sort()).toEqual(catalogModules);
  });

  it("derives the entitlement tiers from the registry, not a local literal", () => {
    const values = Object.values(MODULE_REGISTRY);
    const defaultTier = values
      .filter((module) => module.entitlement === "default")
      .map((module) => module.key);
    const subscriptionTier = values
      .filter((module) => module.entitlement === "subscription")
      .map((module) => module.key);

    expect(DEFAULT_ENABLED_MODULES).toEqual(defaultTier);
    expect(SUBSCRIPTION_ENABLED_MODULES).toEqual([...defaultTier, ...subscriptionTier]);
    expect(GATED_MODULES).toEqual(subscriptionTier);
  });

  it("fixes the drifted `support` key to the permission/nav key `tickets`", () => {
    expect(DEFAULT_ENABLED_MODULES).toContain("tickets");
    expect(DEFAULT_ENABLED_MODULES).not.toContain("support");
    expect(DEFAULT_ENABLED_MODULES).toHaveLength(8);
    expect(SUBSCRIPTION_ENABLED_MODULES).toHaveLength(14);
    expect(GATED_MODULES).toHaveLength(6);
  });

  it("keeps every registry permission scoped to its own module key", () => {
    for (const module of Object.values(MODULE_REGISTRY)) {
      expect(module.name.length).toBeGreaterThan(0);
      expect(module.icon.length).toBeGreaterThan(0);
      for (const permission of module.permissions) {
        expect(permission.startsWith(`${module.key}:`)).toBe(true);
      }
    }
  });
});
