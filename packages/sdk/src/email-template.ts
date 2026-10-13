/**
 * Shared notification-email template (NOTIF-P3-001).
 *
 * Every sender (API `lib/notify.ts`, API `routes/admin.ts` test-email, worker
 * `tasks/scheduled-notifications.ts`) previously built its own inline HTML, so
 * branding, footers and the unsubscribe link had to be added in four places and
 * drifted apart. This module is the single layout/footer contract; senders pass
 * sanitized title/body/link values and get subject + text + html back.
 *
 * Security: the helper escapes every interpolated value itself (defense in
 * depth on top of `redactSensitiveContent`), so a caller cannot accidentally
 * ship an unescaped deep link or body (NOTIF-P3-008).
 */

export const EMAIL_SUBJECT_PREFIX = "[Maine CyberTech]";

/** Escape user-controlled content before interpolating it into email HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface EmailFooterLink {
  label: string;
  url: string;
}

export interface EmailLayoutInput {
  /** Heading shown at the top of the email. */
  heading: string;
  /** Pre-escaped HTML body. */
  bodyHtml: string;
  actionUrl?: string;
  actionLabel?: string;
  footerLinks?: EmailFooterLink[];
}

/**
 * Render the shared email shell. Values in `heading` and the action link are
 * escaped here; `bodyHtml` must already be escaped by the caller (it exists so
 * senders can keep paragraph structure).
 */
export function renderEmailLayout(input: EmailLayoutInput): string {
  const heading = escapeHtml(input.heading);
  const action = input.actionUrl
    ? `<p style="margin: 24px 0;"><a href="${escapeHtml(input.actionUrl)}" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">${escapeHtml(input.actionLabel ?? "View details")}</a></p>`
    : "";
  const footer = (input.footerLinks ?? [])
    .map(
      (link) =>
        `<a href="${escapeHtml(link.url)}" style="color: #6b7280; text-decoration: underline;">${escapeHtml(link.label)}</a>`,
    )
    .join(" &middot; ");

  return `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #374151;">
  <h1 style="color: #059669; font-size: 20px; margin-bottom: 16px;">${heading}</h1>
  <div style="line-height: 1.6;">${input.bodyHtml}</div>
  ${action}
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
  <p style="color: #9ca3af; font-size: 12px; line-height: 1.5;">You are receiving this email because notifications are enabled for your account.${
    footer ? `<br />${footer}` : ""
  }</p>
</div>`;
}

export interface NotificationEmailInput {
  title: string;
  body: string;
  /** Plain-text body override; escaped here before rendering. */
  actionUrl?: string;
  actionLabel?: string;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
}

export interface NotificationEmail {
  subject: string;
  text: string;
  html: string;
}

/** Build the standard footer links (preferences + one-click unsubscribe). */
export function notificationFooterLinks(input: {
  preferencesUrl?: string;
  unsubscribeUrl?: string;
}): EmailFooterLink[] {
  const footerLinks: EmailFooterLink[] = [];
  if (input.preferencesUrl) {
    footerLinks.push({ label: "Manage notification preferences", url: input.preferencesUrl });
  }
  if (input.unsubscribeUrl) {
    footerLinks.push({ label: "Unsubscribe from these emails", url: input.unsubscribeUrl });
  }
  return footerLinks;
}

/**
 * Build the subject/text/html trio for a notification email. The footer always
 * carries the preferences link when one is supplied and the unsubscribe link
 * when the caller can sign one (NOTIF-P3-005).
 */
export function buildNotificationEmail(input: NotificationEmailInput): NotificationEmail {
  const bodyText = input.body;
  const footerLinks = notificationFooterLinks(input);

  const actionUrl = input.actionUrl;
  const textParts = [bodyText];
  if (actionUrl) textParts.push(`View: ${actionUrl}`);
  if (footerLinks.length > 0) {
    textParts.push(footerLinks.map((link) => `${link.label}: ${link.url}`).join("\n"));
  }

  return {
    subject: `${EMAIL_SUBJECT_PREFIX} ${input.title}`,
    text: textParts.join("\n\n"),
    html: renderEmailLayout({
      heading: input.title,
      bodyHtml: escapeHtml(bodyText).replace(/\n/g, "<br/>"),
      actionUrl,
      actionLabel: input.actionLabel,
      footerLinks,
    }),
  };
}
