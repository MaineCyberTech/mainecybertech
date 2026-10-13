export type NotificationLinkTarget = {
  module?: string | null;
  module_id?: string | null;
};

/**
 * Resolve the in-app destination for a notification.
 *
 * USE-P2-004: the portal ticket route is `/portal/support/<id>` — there is no
 * `/portal/tickets/*` route, so ticket notifications used to land on the 404
 * page. Admin tickets keep `/admin/tickets/<id>`.
 */
export function notificationHref(basePath: string, notification: NotificationLinkTarget): string {
  const base = basePath.replace(/\/+$/, "");
  const id = notification.module_id;

  if (!id) return `${base}/notifications`;

  switch (notification.module) {
    case "tickets":
      return base === "/portal" ? `${base}/support/${id}` : `${base}/tickets/${id}`;
    case "projects":
      return `${base}/projects/${id}`;
    case "documents":
      // Only the portal has a per-document route; admin links to the library.
      return base === "/portal" ? `${base}/documents/${id}` : `${base}/documents`;
    default:
      return `${base}/notifications`;
  }
}
