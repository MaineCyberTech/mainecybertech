import { Router } from "express";
import { getScopedClient } from "../services/supabase";
import { logAuditEvent } from "../services/audit";
import { AppError, success, type PaginatedResult } from "../types";
import { requireAuth } from "../middleware/auth";
import { requireOrgAccess } from "../middleware/org-access";
import { loadOwned } from "../lib/tenant";
import { triageInputSchema, convertTriageSchema, copilotReplyDraftSchema } from "../validators/ai";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireOrgAccess);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  hardware: [
    "laptop",
    "desktop",
    "printer",
    "monitor",
    "keyboard",
    "mouse",
    "server",
    "switch",
    "router",
    "firewall",
    "device",
    "broken",
    "dead",
    "wont turn on",
    "not powering",
    "battery",
    "screen",
    "fan",
    "noise",
  ],
  software: [
    "app",
    "application",
    "crash",
    "not responding",
    "error",
    "bug",
    "update",
    "install",
    "uninstall",
    "version",
    "license",
    "excel",
    "word",
    "outlook",
    "browser",
    "chrome",
    "edge",
  ],
  network: [
    "wifi",
    "internet",
    "connection",
    "slow",
    "dns",
    "vpn",
    "remote",
    "access",
    "can't connect",
    "disconnected",
    "offline",
    "bandwidth",
    "latency",
    "unreachable",
  ],
  email: [
    "outlook",
    "gmail",
    "exchange",
    "mailbox",
    "calendar",
    "spam",
    "phishing",
    "send",
    "receive",
    "attachment",
    "signature",
    "delegate",
    "distribution",
    "shared mailbox",
  ],
  access: [
    "password",
    "login",
    "account",
    "locked",
    "can't sign in",
    "reset",
    "mfa",
    "2fa",
    "authenticator",
    "forgotten",
    "permission",
    "access denied",
    "unauthorized",
  ],
  security: [
    "virus",
    "malware",
    "ransomware",
    "suspicious",
    "breach",
    "compromised",
    "hacked",
    "phishing",
    "scan",
    "av",
    "antivirus",
    "defender",
    "alert",
    "incident",
  ],
};

function analyzeDescription(text: string) {
  const lower = text.toLowerCase();
  let category = "general";
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      category = cat;
    }
  }

  const priorityHints = [
    "urgent",
    "asap",
    "emergency",
    "critical",
    "down",
    "outage",
    "broken",
    "locked out",
    "can't work",
    "deadline",
    "immediately",
  ];
  const isUrgent = priorityHints.some((h) => lower.includes(h));

  const subjectWords = text
    .split(/[\s,]+/)
    .slice(0, 8)
    .join(" ");
  const suggestedSubject =
    subjectWords.length > 60 ? subjectWords.slice(0, 60) + "..." : subjectWords;

  const missingInfo: string[] = [];
  if (!text.match(/@/)) missingInfo.push("Requester email address");
  if (!lower.includes("windows") && !lower.includes("mac")) missingInfo.push("Operating system");
  if (!lower.match(/\d/)) missingInfo.push("Error code or specific number");
  if (text.length < 100) missingInfo.push("More detail about what happened before the issue");

  return {
    suggestedCategory: category,
    suggestedPriority: isUrgent ? "high" : "normal",
    suggestedSubject: `[${category}] ${suggestedSubject}`,
    missingInfo,
    confidenceScore: Math.min(100, bestScore * 20 + 40),
  };
}

router.post("/triage/analyze", async (req, res, next) => {
  try {
    const parsed = triageInputSchema.parse(req.body);
    const supabase = getScopedClient(req, "ai", "write");
    const analysis = analyzeDescription(parsed.rawDescription);

    const { data, error } = await supabase
      .from("ticket_triage_drafts")
      .insert({
        organization_id: parsed.organizationId,
        raw_description: parsed.rawDescription,
        suggested_category: analysis.suggestedCategory,
        suggested_priority: analysis.suggestedPriority,
        suggested_subject: analysis.suggestedSubject,
        missing_info: analysis.missingInfo,
        confidence_score: analysis.confidenceScore,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (error) throw new AppError("DB_ERROR", error.message, 500);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "triage.analyzed",
      entityType: "ticket_triage_draft",
      entityId: data.id,
      metadata: { category: analysis.suggestedCategory },
    });

    res.status(201).json(success({ ...data, ...analysis }));
  } catch (error) {
    next(error);
  }
});

router.post("/triage/convert", async (req, res, next) => {
  try {
    const parsed = convertTriageSchema.parse(req.body);
    const supabase = getScopedClient(req, "ai", "write");

    const { data: draft, error: draftError } = await supabase
      .from("ticket_triage_drafts")
      .select("*")
      .eq("id", parsed.triageId)
      .eq("organization_id", parsed.organizationId)
      .single();
    if (draftError || !draft) throw new AppError("NOT_FOUND", "Triage draft not found", 404);

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        organization_id: parsed.organizationId,
        title: parsed.subject,
        description: parsed.ticketBody,
        category: parsed.category || (draft as { suggested_category: string }).suggested_category,
        priority: parsed.priority,
        created_by: req.authUser!.userId,
      })
      .select()
      .single();

    if (ticketError) throw new AppError("DB_ERROR", ticketError.message, 500);

    await supabase
      .from("ticket_triage_drafts")
      .update({
        status: "converted",
        converted_ticket_id: ticket.id,
        reviewed_by: req.authUser!.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", parsed.triageId);

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "triage.converted_to_ticket",
      entityType: "ticket",
      entityId: ticket.id,
      metadata: { triageId: parsed.triageId, subject: parsed.subject },
    });

    res.status(201).json(success({ ticket, triageId: parsed.triageId }));
  } catch (error) {
    next(error);
  }
});

router.get("/triage", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "ai", "read");
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 25));
    const offset = (page - 1) * limit;

    let q = supabase.from("ticket_triage_drafts").select("*", { count: "exact" });
    const orgId = req.query.organization_id as string | undefined;
    if (orgId) q = q.eq("organization_id", orgId);

    const { data, error, count } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new AppError("DB_ERROR", error.message, 500);
    res.json(
      success({ items: data ?? [], total: count ?? 0, page, limit } as PaginatedResult<unknown>),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/copilot/:ticketId/summarize", async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "ai", "read");

    const ticket = (await loadOwned(
      req,
      supabase as any,
      "tickets",
      String(req.params.ticketId),
      "id, title, description, status, priority, category, created_at, organization_id",
    )) as {
      id: string;
      title: string;
      description: string;
      status: string;
      priority: string;
      category: string;
      created_at: string;
      organization_id: string;
    };

    const { data: comments } = await supabase
      .from("ticket_comments")
      .select("body, author_id, created_at")
      .eq("ticket_id", req.params.ticketId)
      .eq("organization_id", ticket.organization_id)
      .order("created_at", { ascending: true });
    const commentList = comments ?? [];

    const summary = {
      ticketId: ticket.id,
      subject: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created: ticket.created_at,
      commentCount: commentList.length,
      lastActivity:
        commentList.length > 0
          ? (commentList[commentList.length - 1] as { created_at: string }).created_at
          : ticket.created_at,
      keyPoints: [
        `Priority: ${ticket.priority}`,
        `Status: ${ticket.status}`,
        `Category: ${ticket.category}`,
        `${commentList.length} comments in thread`,
      ],
      suggestedNextAction:
        ticket.status === "resolved"
          ? "Review resolution and close or reopen"
          : commentList.length === 0
            ? "No responses yet — craft initial reply"
            : `${commentList.length} responses — review latest and follow up`,
    };

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "copilot.summarized",
      entityType: "ticket",
      entityId: req.params.ticketId,
    });

    res.json(success(summary));
  } catch (error) {
    next(error);
  }
});

router.post("/copilot/:ticketId/reply-draft", async (req, res, next) => {
  try {
    const parsed = copilotReplyDraftSchema.parse(req.body);
    const supabase = getScopedClient(req, "ai", "write");

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("id, title, description, status, priority")
      .eq("id", req.params.ticketId)
      .single();
    if (ticketError || !ticket) throw new AppError("NOT_FOUND", "Ticket not found", 404);

    const { data: comments } = await supabase
      .from("ticket_comments")
      .select("body")
      .eq("ticket_id", req.params.ticketId)
      .order("created_at", { ascending: false })
      .limit(3);

    const lastComment =
      (comments ?? []).length > 0 ? (comments as Array<{ body: string }>)[0].body : null;

    const tones: Record<string, string> = {
      formal: "Thank you for contacting us regarding this issue.",
      friendly: "Hi there! Thanks for reaching out — we're on it.",
      technical:
        "Acknowledged. We are investigating this issue and will provide technical analysis shortly.",
      concise: "Got it. Working on this now.",
    };

    const draftReply = [
      tones[parsed.tone],
      "",
      lastComment
        ? `Regarding your latest update: "${lastComment.slice(0, 200)}${lastComment.length > 200 ? "..." : ""}"`
        : `Regarding: ${(ticket as { title: string }).title}`,
      "",
      "We are reviewing this and will follow up shortly.",
      "",
      "Best regards,",
      "Maine CyberTech Support",
    ].join("\n");

    await logAuditEvent({
      organizationId: parsed.organizationId,
      actorUserId: req.authUser!.userId,
      action: "copilot.reply_drafted",
      entityType: "ticket",
      entityId: req.params.ticketId,
    });

    res.json(
      success({
        draftReply,
        ticketSubject: (ticket as { title: string }).title,
        tone: parsed.tone,
      }),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
