import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/admin";
import { sendEmail } from "../lib/email";
import { AppError, success } from "../types";
import { logAuditEvent } from "../services/audit";

const router: ReturnType<typeof Router> = Router();
router.use(requireAuth);
router.use(requireAdmin);

// POST /api/v1/admin/test-email — send a test email to verify SMTP config
router.post("/test-email", async (req, res, next) => {
  try {
    const { to } = z.object({ to: z.string().email() }).parse(req.body);

    const sent = await sendEmail({
      to,
      subject: "MCT Portal — Test Email",
      text: "This is a test email from the Maine CyberTech Portal. If you received this, SMTP is configured correctly.",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="color: #059669; margin-bottom: 16px;">✅ Test Email</h1>
          <p style="color: #374151; line-height: 1.6;">This is a test email from the <strong>Maine CyberTech Portal</strong>.</p>
          <p style="color: #374151; line-height: 1.6;">If you received this, SMTP is configured correctly.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Sent from the MCT Portal admin panel</p>
        </div>
      `,
    });

    if (!sent) {
      throw new AppError(
        "SMTP_ERROR",
        "SMTP is not configured or sending failed",
        502,
      );
    }

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "admin.test_email",
      entityType: "admin",
      metadata: { to },
    });

    res.json(success({ sent: true, to }));
  } catch (error) {
    next(error);
  }
});

export default router;
