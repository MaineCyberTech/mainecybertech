import { getSupabaseAdmin } from "../services/supabase";
import { sendEmail } from "./email";
import { logger } from "./logger";
import { getEnv } from "../config/env";

type NotifyOptions = {
  userId: string;
  organizationId?: string;
  title: string;
  body: string;
  module: "tickets" | "projects" | "documents" | "billing" | "system";
  moduleId?: string;
  action: string;
  emailOverride?: boolean;
};

export async function createNotification(opts: NotifyOptions) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("notifications").insert({
      user_id: opts.userId,
      organization_id: opts.organizationId ?? null,
      title: opts.title,
      body: opts.body,
      module: opts.module,
      module_id: opts.moduleId ?? null,
      action: opts.action,
    });
  } catch (error) {
    logger.warn(
      { error: String(error), userId: opts.userId, title: opts.title },
      "Failed to create in-app notification",
    );
  }
}

export async function notifyAndEmail(
  opts: NotifyOptions & { email: string; emailHtml?: string },
) {
  await createNotification(opts);

  const baseUrl = getEnv().APP_BASE_URL;
  const modulePath =
    opts.module === "tickets" && opts.moduleId
      ? `/portal/tickets/${opts.moduleId}`
      : opts.module === "projects" && opts.moduleId
        ? `/portal/projects/${opts.moduleId}`
        : opts.module === "documents" && opts.moduleId
          ? `/portal/documents/${opts.moduleId}`
          : "";

  await sendEmail({
    to: opts.email,
    subject: `[Maine CyberTech] ${opts.title}`,
    text: `${opts.body}\n\nView: ${baseUrl}${modulePath}`,
    html:
      opts.emailHtml ??
      `<p>${opts.body.replace(/\n/g, "<br/>")}</p>${modulePath ? `<p><a href="${baseUrl}${modulePath}">View details</a></p>` : ""}`,
  });
}
