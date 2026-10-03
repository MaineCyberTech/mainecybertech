import { can, hasPermission, permKey } from "@/lib/permissions";

describe("lib/permissions", () => {
  describe("permKey", () => {
    it("joins module and action", () => {
      expect(permKey("tickets", "view")).toBe("tickets:view");
      expect(permKey("webhooks", "manage")).toBe("webhooks:manage");
    });
  });

  describe("hasPermission", () => {
    it("returns true when the key is present", () => {
      expect(hasPermission(["tickets:view", "users:edit"], "tickets", "view")).toBe(true);
    });

    it("returns false when the key is absent", () => {
      expect(hasPermission(["tickets:view"], "users", "view")).toBe(false);
      expect(hasPermission(["tickets:view"], "tickets", "delete")).toBe(false);
    });

    it("returns false for empty/null keys", () => {
      expect(hasPermission([], "tickets", "view")).toBe(false);
      expect(hasPermission(undefined, "tickets", "view")).toBe(false);
      expect(hasPermission(null, "tickets", "view")).toBe(false);
    });
  });

  describe("can", () => {
    it("grants everything to super admins", () => {
      const perms = {
        isSuperAdmin: true,
        keys: [],
        permissions: [],
        roles: ["super_admin"],
      };
      expect(can(perms, "organizations", "delete")).toBe(true);
      expect(can(perms, "webhooks", "manage")).toBe(true);
    });

    it("checks keys for non-super admins", () => {
      const perms = {
        isSuperAdmin: false,
        keys: ["tickets:view"],
        permissions: [],
        roles: ["client_user"],
      };
      expect(can(perms, "tickets", "view")).toBe(true);
      expect(can(perms, "tickets", "create")).toBe(false);
    });

    it("returns false when perms is missing", () => {
      expect(can(undefined, "tickets", "view")).toBe(false);
      expect(can(null, "tickets", "view")).toBe(false);
    });
  });
});
