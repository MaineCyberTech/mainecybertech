import { sendEmail } from "../email";
import type { TaskHandler, TaskResult } from "../task-registry";

type NotificationEmailPayload = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export const notificationEmail: TaskHandler = async (
  payload,
): Promise<TaskResult> => {
  const { to, subject, text, html } = payload as NotificationEmailPayload;
  if (!to || !subject) {
    return { ok: false, error: "to and subject are required" };
  }
  const sent = await sendEmail({ to, subject, text, html });
  return sent ? { ok: true } : { ok: false, error: "Email send failed" };
};
