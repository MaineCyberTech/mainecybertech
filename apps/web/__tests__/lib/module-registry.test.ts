import { MODULE_REGISTRY } from "@mct/sdk/module-registry";
import { icons } from "lucide-react";
import { MODULE_LABELS } from "@/lib/permissions";
import { PORTAL_NAV_GROUPS } from "@/lib/navigation/portal-nav";
import { ADMIN_NAV_GROUPS } from "@/lib/navigation/admin-nav";

/**
 * EVOL-P2-001: the shared module registry is the single source of truth for
 * module identity. These guards fail CI when the nav catalogs, MODULE_LABELS,
 * or the icon names drift from the registry.
 */

const SURFACES = [
  {
    name: "portal",
    groups: PORTAL_NAV_GROUPS,
    routes: (m: (typeof MODULE_REGISTRY)[string]) => m.routes?.portal,
  },
  {
    name: "admin",
    groups: ADMIN_NAV_GROUPS,
    routes: (m: (typeof MODULE_REGISTRY)[string]) => m.routes?.admin,
  },
];

describe("module registry (EVOL-P2-001)", () => {
  it("labels every registry module with its registry name", () => {
    expect(Object.keys(MODULE_LABELS).sort()).toEqual(Object.keys(MODULE_REGISTRY).sort());
    for (const [key, label] of Object.entries(MODULE_LABELS)) {
      expect(label).toBe(MODULE_REGISTRY[key].name);
    }
  });

  it("registers every module referenced by the portal/admin nav catalogs", () => {
    for (const surface of SURFACES) {
      for (const group of surface.groups) {
        for (const item of group.items) {
          if (!item.module) continue;
          const module = MODULE_REGISTRY[item.module];
          expect(module).toBeDefined();
          expect(surface.routes(module) ?? []).toContain(item.href);
        }
      }
    }
  });

  it("uses only lucide-react icon names that exist", () => {
    const knownIcons = new Set(Object.keys(icons));
    const unknown = Object.values(MODULE_REGISTRY)
      .filter((module) => !knownIcons.has(module.icon))
      .map((module) => `${module.key}:${module.icon}`);
    expect(unknown).toEqual([]);
  });
});
