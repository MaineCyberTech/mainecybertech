import { MODULE_REGISTRY } from "../module-registry";
import { WEBHOOK_EVENTS, isWebhookEvent } from "../webhook-events";

describe("shared catalogs", () => {
  it("keeps webhook events unique and guarded", () => {
    expect(new Set(WEBHOOK_EVENTS).size).toBe(WEBHOOK_EVENTS.length);
    expect(WEBHOOK_EVENTS).toContain("ticket.created");
    expect(isWebhookEvent("ticket.created")).toBe(true);
    expect(isWebhookEvent("ticket.exploded")).toBe(false);
  });

  it("keeps module registry keys unique and permissions module-scoped", () => {
    const modules = Object.values(MODULE_REGISTRY);
    const keys = modules.map((module) => module.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const module of modules) {
      expect(module.name.length).toBeGreaterThan(0);
      expect(module.icon.length).toBeGreaterThan(0);
      expect(module.permissions.every((key) => key.startsWith(`${module.key}:`))).toBe(true);
    }
  });
});
