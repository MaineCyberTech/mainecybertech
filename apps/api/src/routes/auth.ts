import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../services/supabase";
import { getEnv } from "../config/env";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { logAuditEvent } from "../services/audit";
import { logger } from "../lib/logger";
import { rateLimitAuth } from "../middleware/rate-limit";

const router: ReturnType<typeof Router> = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", req.authUser!.userId)
      .single();

    if (error || !profile) {
      res.json(
        success({ userId: req.authUser!.userId, email: req.authUser!.email }),
      );
      return;
    }

    res.json(
      success({
        userId: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        title: profile.title,
        isSuperAdmin: profile.is_super_admin,
        defaultOrganizationId: profile.default_organization_id,
        createdAt: profile.created_at,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/sign-in", rateLimitAuth, async (req, res, next) => {
  try {
    const { email, password } = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(req.body);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AppError("AUTH_ERROR", error.message, 401);
    }

    await logAuditEvent({
      actorUserId: data.user.id,
      action: "auth.sign-in",
      entityType: "user",
      entityId: data.user.id,
      metadata: { email },
    });

    res.json(
      success({
        accessToken: data.session.access_token,
        user: { id: data.user.id, email: data.user.email },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/sign-up", rateLimitAuth, async (req, res, next) => {
  try {
    const { email, password, fullName } = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        fullName: z.string().max(100).optional(),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${req.protocol}://${req.get("host")}/auth/callback`,
        data: { full_name: fullName ?? null },
      },
    });

    if (error) {
      throw new AppError("AUTH_ERROR", error.message, 400);
    }

    if (data.user) {
      await logAuditEvent({
        actorUserId: data.user.id,
        action: "auth.sign-up",
        entityType: "user",
        entityId: data.user.id,
        metadata: { email },
      });
    }

    res.json(
      success({
        user: data.user ? { id: data.user.id, email: data.user.email } : null,
      }),
    );
  } catch (error) {
    next(error);
  }
});

function extractCodeVerifier(
  cookies: string,
  supabaseUrl: string,
): string | null {
  const hostname = new URL(supabaseUrl).hostname;
  const ref = hostname.split(".")[0];
  const verifierKey = `sb-${ref}-auth-token-code-verifier`;
  const match = cookies
    .split(";")
    .find((c) => c.trim().startsWith(`${verifierKey}=`));
  return match
    ? decodeURIComponent(match.split("=").slice(1).join("=").trim())
    : null;
}

router.post("/callback", rateLimitAuth, async (req, res, next) => {
  try {
    const {
      auth_code,
      code_verifier: directVerifier,
      cookies,
    } = req.body as {
      auth_code: string;
      code_verifier?: string | null;
      cookies?: string;
    };

    if (!auth_code) {
      throw new AppError("VALIDATION", "auth_code is required", 400);
    }

    const env = getEnv();

    const codeVerifier =
      directVerifier ??
      (cookies ? extractCodeVerifier(cookies, env.SUPABASE_URL) : null);

    const body: Record<string, string> = { auth_code };
    if (codeVerifier) body.code_verifier = codeVerifier;

    const tokenRes = await fetch(
      `${env.SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(body),
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new AppError("AUTH_ERROR", "Failed to exchange auth code", 401);
    }

    const accessToken: string = tokenData.access_token;

    await logAuditEvent({
      actorUserId: tokenData.user?.id ?? null,
      action: "auth.callback",
      entityType: "user",
      entityId: tokenData.user?.id ?? null,
      metadata: { email: tokenData.user?.email ?? null },
    });

    const rpcRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/rpc/bootstrap_portal_access`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!rpcRes.ok) {
      const rpcBody = await rpcRes.text();
      logger.error({ rpcBody }, "bootstrap_portal_access RPC failed");
    }

    res.json(
      success({
        accessToken,
        user: {
          id: tokenData.user?.id ?? null,
          email: tokenData.user?.email ?? null,
        },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/sign-out", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const token = req.headers.authorization?.slice(7);
    if (token) {
      await supabase.auth.admin.signOut(token);
    }
    await logAuditEvent({
      actorUserId: req.authUser?.userId,
      action: "auth.sign-out",
      entityType: "user",
      entityId: req.authUser?.userId,
    });
    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", rateLimitAuth, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin ?? "http://localhost:3000"}/password-reset`,
    });

    if (error) {
      throw new AppError("AUTH_ERROR", error.message, 400);
    }

    await logAuditEvent({
      action: "auth.forgot-password",
      entityType: "user",
      metadata: { email },
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", rateLimitAuth, async (req, res, next) => {
  try {
    const { email, password } = z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(req.body);

    const supabase = getSupabaseAdmin();
    const { data: users, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (lookupError || !users) {
      throw new AppError("NOT_FOUND", "User not found", 404);
    }

    const { error } = await supabase.auth.admin.updateUserById(users.id, {
      password,
    });

    if (error) {
      throw new AppError("AUTH_ERROR", error.message, 400);
    }

    await logAuditEvent({
      actorUserId: users.id,
      action: "auth.reset-password",
      entityType: "user",
      entityId: users.id,
      metadata: { email },
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
