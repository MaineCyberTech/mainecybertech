import { MODULE_REGISTRY } from "../module-registry";
import { WEBHOOK_EVENTS, isWebhookEvent } from "../webhook-events";
import {
  CROSS_TENANT_KEYS,
  ELEVATED_TENANT_KEYS,
  PLATFORM_ADMIN_KEYS,
  isCrossTenantKey,
  isElevatedTenantKey,
  isPlatformAdminKey,
  roleKeyOf,
} from "../role-keys";
import {
  TICKET_STATUSES,
  TICKET_STATUS_TRANSITIONS,
  allowedTicketTransitions,
  isTicketStatus,
  isTicketTransitionAllowed,
} from "../ticket-status";

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

  // ADMIN-P3-001: shared role keys keep the API requireAdmin gate and the web
  // admin gate on the same cross-tenant set.
  it("splits cross-tenant roles from elevated tenant roles", () => {
    expect([...CROSS_TENANT_KEYS]).toEqual(["super_admin", "admin"]);
    expect(new Set([...CROSS_TENANT_KEYS, ...ELEVATED_TENANT_KEYS])).toEqual(
      new Set(PLATFORM_ADMIN_KEYS),
    );
    expect(PLATFORM_ADMIN_KEYS.length).toBe(new Set(PLATFORM_ADMIN_KEYS).size);
    for (const key of ELEVATED_TENANT_KEYS) {
      expect(isCrossTenantKey(key)).toBe(false);
      expect(isElevatedTenantKey(key)).toBe(true);
      expect(isPlatformAdminKey(key)).toBe(true);
    }
    expect(isCrossTenantKey("admin")).toBe(true);
    expect(isCrossTenantKey("super_admin")).toBe(true);
    expect(isCrossTenantKey(null)).toBe(false);
    expect(isPlatformAdminKey(undefined)).toBe(false);
    // roleKeyOf tolerates both embed shapes (object or single-element array).
    expect(roleKeyOf({ id: "r1", key: "admin" })).toBe("admin");
    expect(roleKeyOf([{ id: "r1", key: "engineer" }])).toBe("engineer");
    expect(roleKeyOf(null)).toBeUndefined();
  });

  // FEAT-P3-006: the ticket transition map is the shared contract between the
  // API validation and the admin status selectors.
  it("allows the documented ticket flow and reopens", () => {
    expect(isTicketStatus("waiting_on_client")).toBe(true);
    expect(isTicketStatus("pending")).toBe(false);
    for (const status of TICKET_STATUSES) {
      expect(TICKET_STATUS_TRANSITIONS[status]).not.toContain(status);
      expect(isTicketTransitionAllowed(status, status)).toBe(true);
      for (const next of TICKET_STATUS_TRANSITIONS[status]) {
        expect(TICKET_STATUSES).toContain(next);
        expect(isTicketTransitionAllowed(status, next)).toBe(true);
      }
    }
    expect(isTicketTransitionAllowed("open", "in_progress")).toBe(true);
    expect(isTicketTransitionAllowed("resolved", "closed")).toBe(true);
    expect(isTicketTransitionAllowed("closed", "in_progress")).toBe(true);
  });

  it("rejects ticket jumps outside the transition map", () => {
    expect(isTicketTransitionAllowed("new", "resolved")).toBe(false);
    expect(isTicketTransitionAllowed("closed", "new")).toBe(false);
    expect(isTicketTransitionAllowed("new", "bogus")).toBe(false);
    // Unknown current status (partial read / legacy row) must not block updates.
    expect(isTicketTransitionAllowed(undefined, "closed")).toBe(true);
    expect(isTicketTransitionAllowed("legacy", "closed")).toBe(true);
    expect(allowedTicketTransitions("new")).toEqual(TICKET_STATUS_TRANSITIONS.new);
    expect(allowedTicketTransitions(undefined)).toEqual(TICKET_STATUSES);
  });
});
