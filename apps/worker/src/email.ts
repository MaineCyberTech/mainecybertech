import pino from "pino";
import { env } from "./env";

const logger = pino({ level: env.LOG_LEVEL });

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const host = env.SMTP_HOST;
  if (!host) {
    logger.warn("SMTP_HOST not configured; skipping email send");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host,
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

    logger.info({ to, subject }, "Email sent");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, to, subject }, "Failed to send email");
    return false;
  }
}
