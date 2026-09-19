import { Router } from "express";
import { z } from "zod";
import zxcvbn from "zxcvbn";
import { getSupabaseAdmin, getScopedClient, getSupabaseUser } from "../services/supabase";
import { getEnv } from "../config/env";
import { AppError, success } from "../types";
import { requireAuth } from "../middleware/auth";
import { logAuditEvent } from "../services/audit";
import { logger } from "../lib/logger";
import { rateLimitAuth, rateLimitEmail } from "../middleware/rate-limit";
import { recordAuthAttempt } from "../lib/metrics";

const router: ReturnType<typeof Router> = Router();

const MIN_PASSWORD_SCORE = 3; // zxcvbn score 0-4, require at least 3 (strong)

function validatePasswordStrength(password: string): {
  valid: boolean;
  message?: string;
} {
  const result = zxcvbn(password);
  if (result.score < MIN_PASSWORD_SCORE) {
    const feedback = result.feedback.warning ? result.feedback.warning : "Password is too weak";
    return { valid: false, message: feedback };
  }
  return { valid: true };
}

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const supabase = getScopedClient(req, "auth", "read");
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, email, phone, title, is_super_admin, default_organization_id, created_at",
      )
      .eq("id", req.authUser!.userId)
      .single();

    if (error || !profile) {
      res.json(success({ userId: req.authUser!.userId, email: req.authUser!.email }));
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
      recordAuthAttempt("failure");
      logAuditEvent({
        action: "auth.sign-in.failed",
        entityType: "user",
        metadata: { email, reason: error.message },
      });
      throw new AppError("AUTH_ERROR", error.message, 401);
    }

    await logAuditEvent({
      actorUserId: data.user.id,
      action: "auth.sign-in",
      entityType: "user",
      entityId: data.user.id,
      metadata: { email },
    });
    recordAuthAttempt("success");

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
        password: z
          .string()
          .min(1)
          .refine(
            (password) => {
              const result = validatePasswordStrength(password);
              return result.valid;
            },
            { message: "Password is too weak" },
          ),
        fullName: z.string().max(100).optional(),
      })
      .parse(req.body);

    const pwdCheck = validatePasswordStrength(password);
    if (!pwdCheck.valid) {
      throw new AppError("WEAK_PASSWORD", pwdCheck.message || "Password is too weak", 400);
    }

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

function extractCodeVerifier(cookies: string, supabaseUrl: string): string | null {
  const hostname = new URL(supabaseUrl).hostname;
  const ref = hostname.split(".")[0];
  const verifierKey = `sb-${ref}-auth-token-code-verifier`;
  const match = cookies.split(";").find((c) => c.trim().startsWith(`${verifierKey}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=").trim()) : null;
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
      directVerifier ?? (cookies ? extractCodeVerifier(cookies, env.SUPABASE_URL) : null);

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

    const rpcRes = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/bootstrap_portal_access`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    });

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
    const supabase = getScopedClient(req, "auth", "write");
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

router.post("/forgot-password", rateLimitAuth, rateLimitEmail, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${req.headers.origin ?? getEnv().APP_BASE_URL}/password-reset`,
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

router.post(
  "/reset-password",
  requireAuth,
  rateLimitAuth,
  rateLimitEmail,
  async (req, res, next) => {
    try {
      const { email, password } = z
        .object({
          email: z.string().email(),
          password: z
            .string()
            .min(1)
            .refine(
              (password) => {
                const result = validatePasswordStrength(password);
                return result.valid;
              },
              { message: "Password is too weak" },
            ),
        })
        .parse(req.body);

      if (email !== req.authUser!.email) {
        throw new AppError("FORBIDDEN", "You can only reset your own password", 403);
      }

      const pwdCheck = validatePasswordStrength(password);
      if (!pwdCheck.valid) {
        throw new AppError("WEAK_PASSWORD", pwdCheck.message || "Password is too weak", 400);
      }

      const supabase = getScopedClient(req, "auth", "write");
      const { error } = await supabase.auth.admin.updateUserById(req.authUser!.userId, {
        password,
      });

      if (error) {
        throw new AppError("AUTH_ERROR", error.message, 400);
      }

      await logAuditEvent({
        actorUserId: req.authUser!.userId,
        action: "auth.reset-password",
        entityType: "user",
        entityId: req.authUser!.userId,
        metadata: { email },
      });

      res.json(success({ ok: true }));
    } catch (error) {
      next(error);
    }
  },
);

// --- Multi-factor authentication (Supabase GoTrue TOTP) -------------------
//
// Identity is delegated entirely to hosted Supabase (see AGENTS.md), so MFA
// factors live in GoTrue's `auth.mfa_factors`; the portal does not store
// secrets. These endpoints let an authenticated user manage their own
// authenticator-app factor. They are deliberately non-enforcing: a policy
// that requires aal2 at request time needs an aal check in `requireAuth`
// plus Supabase MFA enabled for the project, and is rolled out separately.

router.get("/mfa/factors", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseUser(req, req.userJwt!);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) throw new AppError("AUTH_ERROR", error.message, 400);

    res.json(
      success({
        totp: (data?.totp ?? []).map((f) => ({
          id: f.id,
          friendlyName: f.friendly_name ?? null,
          status: f.status,
          createdAt: f.created_at,
        })),
        all: (data?.all ?? []).map((f) => ({
          id: f.id,
          factorType: f.factor_type,
          friendlyName: f.friendly_name ?? null,
          status: f.status,
        })),
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/mfa/enroll", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    const { friendlyName } = z
      .object({ friendlyName: z.string().max(64).optional() })
      .parse(req.body ?? {});

    const supabase = getSupabaseUser(req, req.userJwt!);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });
    if (error) throw new AppError("AUTH_ERROR", error.message, 400);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "auth.mfa.enroll.started",
      entityType: "user",
      entityId: req.authUser!.userId,
      metadata: { factorId: data.id },
    });

    res.status(201).json(
      success({
        factorId: data.id,
        type: data.type,
        friendlyName: data.friendly_name ?? null,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post("/mfa/challenge", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    const { factorId } = z.object({ factorId: z.string().min(1) }).parse(req.body);
    const supabase = getSupabaseUser(req, req.userJwt!);
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) throw new AppError("AUTH_ERROR", error.message, 400);

    res.json(success({ challengeId: data.id, expiresAt: data.expires_at }));
  } catch (error) {
    next(error);
  }
});

router.post("/mfa/verify", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    const { factorId, challengeId, code } = z
      .object({
        factorId: z.string().min(1),
        challengeId: z.string().min(1),
        code: z.string().min(6).max(8),
      })
      .parse(req.body);

    const supabase = getSupabaseUser(req, req.userJwt!);
    const { data, error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) throw new AppError("AUTH_ERROR", error.message, 401);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "auth.mfa.verify",
      entityType: "user",
      entityId: req.authUser!.userId,
      metadata: { factorId },
    });

    // A successful verify upgrades the session to aal2 and returns a fresh
    // access token; callers should replace their stored token with this one.
    res.json(
      success({
        accessToken: data.access_token,
        user: { id: req.authUser!.userId, email: req.authUser!.email },
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.delete("/mfa/factors/:factorId", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    const factorId = String(req.params.factorId as string);
    const supabase = getSupabaseUser(req, req.userJwt!);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new AppError("AUTH_ERROR", error.message, 400);

    await logAuditEvent({
      actorUserId: req.authUser!.userId,
      action: "auth.mfa.unenroll",
      entityType: "user",
      entityId: req.authUser!.userId,
      metadata: { factorId },
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

export default router;
