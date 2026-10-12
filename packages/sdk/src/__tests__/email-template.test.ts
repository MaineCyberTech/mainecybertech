import {
  EMAIL_SUBJECT_PREFIX,
  buildNotificationEmail,
  escapeHtml,
  renderEmailLayout,
} from "../email-template";

describe("email template (NOTIF-P3-001)", () => {
  it("prefixes subjects consistently", () => {
    const email = buildNotificationEmail({ title: "Task Due Soon", body: "Do the thing." });
    expect(email.subject).toBe(`${EMAIL_SUBJECT_PREFIX} Task Due Soon`);
    expect(email.text).toContain("Do the thing.");
  });

  it("includes the preferences and unsubscribe footer links", () => {
    const email = buildNotificationEmail({
      title: "Ticket Updated",
      body: "A ticket changed.",
      preferencesUrl: "https://app.test/portal/notifications/preferences",
      unsubscribeUrl: "https://api.test/api/v1/notifications/unsubscribe?token=abc",
    });
    expect(email.html).toContain("Manage notification preferences");
    expect(email.html).toContain("https://app.test/portal/notifications/preferences");
    expect(email.html).toContain("Unsubscribe from these emails");
    expect(email.html).toContain("api/v1/notifications/unsubscribe");
    expect(email.text).toContain("Manage notification preferences:");
    expect(email.text).toContain("Unsubscribe from these emails:");
  });

  it("omits footer links when none are supplied", () => {
    const email = buildNotificationEmail({ title: "Custom", body: "hello" });
    expect(email.html).not.toContain("Unsubscribe");
    expect(email.html).not.toContain("Manage notification preferences");
  });

  it("escapes body content, action labels and URLs (NOTIF-P3-008)", () => {
    const email = buildNotificationEmail({
      title: "<script>alert(1)</script>",
      body: '<img src=x onerror=alert(1)>',
      actionUrl: 'https://app.test/portal/tickets/"><script>alert(1)</script>',
      actionLabel: "<b>Open</b>",
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).not.toContain("<b>Open</b>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("escapes heading and footer values in the raw layout", () => {
    const html = renderEmailLayout({
      heading: "<h1>owned</h1>",
      bodyHtml: "safe",
      footerLinks: [{ label: "<script>", url: 'https://x.test/"' }],
    });
    expect(html).not.toContain("<h1>owned</h1>");
    expect(html).toContain("&lt;h1&gt;owned&lt;/h1&gt;");
    expect(html).toContain("&quot;");
  });

  it("escapes HTML entities in the shared helper", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
});
