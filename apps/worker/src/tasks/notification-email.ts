import { sendEmail } from "../email";
import type { TaskHandler, TaskResult } from "../task-registry";

type NotificationEmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  /** NOTIF-P2-012: RFC 8058 List-Unsubscribe/-Post headers from the producer. */
  headers?: Record<string, string>;
};

export const notificationEmail: TaskHandler = async (
  payload,
): Promise<TaskResult> => {
  const { to, subject, text, html, headers } = payload as NotificationEmailPayload;
  if (!to || !subject) {
    return { ok: false, error: "to and subject are required" };
  }
  const sent = await sendEmail({ to, subject, text, html, headers });
  return sent ? { ok: true } : { ok: false, error: "Email send failed" };
};
