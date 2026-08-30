import { env } from "./env";
import { logger } from "./logger";

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

const MAX_ATTEMPTS = 3;
const BASE_RETRY_MS = 1000;

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const host = env.SMTP_HOST;
  if (!host) {
    logger.warn("SMTP_HOST not configured; skipping email send");
    return false;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_PORT === 465,
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
    greetingTimeout: 10_000,
    auth: {
      user: env.SMTP_USER ?? "",
      pass: env.SMTP_PASS ?? "",
    },
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await transporter.sendMail({
        from: env.EMAIL_FROM ?? "noreply@mainecybertech.com",
        to,
        subject,
        text,
        html,
      });

      logger.info({ subject }, "Email sent");
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPTS) {
        const backoffMs = BASE_RETRY_MS * 2 ** (attempt - 1);
        logger.warn(
          { attempt, error: msg, subject },
          `Email send failed — retrying in ${backoffMs}ms`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      } else {
        logger.error({ error: msg, subject }, "Failed to send email after all attempts");
      }
    }
  }

  return false;
}
