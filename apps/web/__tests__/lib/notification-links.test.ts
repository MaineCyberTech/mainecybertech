import { notificationHref } from "@/lib/notification-links";

describe("notificationHref", () => {
  it("maps portal ticket notifications to the portal support route", () => {
    // /portal/tickets/<id> does not exist; the real route is /portal/support/<id>.
    expect(notificationHref("/portal", { module: "tickets", module_id: "t-1" })).toBe(
      "/portal/support/t-1",
    );
  });

  it("keeps admin ticket notifications on /admin/tickets/<id>", () => {
    expect(notificationHref("/admin", { module: "tickets", module_id: "t-1" })).toBe(
      "/admin/tickets/t-1",
    );
  });

  it("maps project notifications per base path", () => {
    expect(notificationHref("/portal", { module: "projects", module_id: "p-1" })).toBe(
      "/portal/projects/p-1",
    );
    expect(notificationHref("/admin", { module: "projects", module_id: "p-1" })).toBe(
      "/admin/projects/p-1",
    );
  });

  it("maps document notifications to existing routes", () => {
    expect(notificationHref("/portal", { module: "documents", module_id: "d-1" })).toBe(
      "/portal/documents/d-1",
    );
    // The admin console has no per-document route, so link to the library.
    expect(notificationHref("/admin", { module: "documents", module_id: "d-1" })).toBe(
      "/admin/documents",
    );
  });

  it("falls back to the notifications page without a module id or module", () => {
    expect(notificationHref("/portal", { module: "tickets", module_id: null })).toBe(
      "/portal/notifications",
    );
    expect(notificationHref("/admin", { module: "billing", module_id: "b-1" })).toBe(
      "/admin/notifications",
    );
  });

  it("tolerates a trailing slash on the base path", () => {
    expect(notificationHref("/portal/", { module: "tickets", module_id: "t-1" })).toBe(
      "/portal/support/t-1",
    );
  });
});
