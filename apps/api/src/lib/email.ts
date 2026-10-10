import nodemailer from "nodemailer";
import { getEnv } from "../config/env";
import { logger } from "./logger";
import { recordNotificationDelivery } from "./metrics";

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

// NOTIF-P2-006: bounded in-process retry for the inline fallback (used when the
// worker queue is unavailable). A single transient SMTP failure must not
// silently drop the notification; the worker queue owns its own retry/backoff
// when it is available, so this stays deliberately small.
const EMAIL_MAX_ATTEMPTS = 3;
const EMAIL_RETRY_BASE_DELAY_MS = 250;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    logger.warn("SMTP not configured; skipping email");
    recordNotificationDelivery("email", "skipped");
    return false;
  }

  for (let attempt = 1; attempt <= EMAIL_MAX_ATTEMPTS; attempt++) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER ?? "",
          pass: env.SMTP_PASS ?? "",
        },
      });

      await transporter.sendMail({
        from: env.EMAIL_FROM ?? "noreply@mainecybertech.com",
        to,
        subject,
        text,
        html,
      });

      logger.info({ to: "***", subject, attempt }, "Email sent");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      // Do not log the recipient address (PII).
      logger.error({ error: msg, to: "***", subject, attempt }, "Failed to send email");
      if (attempt < EMAIL_MAX_ATTEMPTS) {
        await sleep(EMAIL_RETRY_BASE_DELAY_MS * attempt);
      }
    }
  }

  return false;
}
