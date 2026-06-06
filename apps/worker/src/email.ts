import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<boolean> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    logger.warn("SMTP_HOST not configured; skipping email send");
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER ?? "",
        pass: process.env.SMTP_PASS ?? "",
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? "noreply@mainecybertech.com",
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
