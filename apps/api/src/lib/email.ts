import nodemailer from "nodemailer";
import { getEnv } from "../config/env";
import { logger } from "./logger";

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const env = getEnv();
  if (!env.SMTP_HOST) {
    logger.warn("SMTP not configured; skipping email");
    return false;
  }

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

    logger.info({ to, subject }, "Email sent");
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error({ error: msg, to, subject }, "Failed to send email");
    return false;
  }
}
