import { Router, type Request } from "express";
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
import { clearMfaFactorCache, decodeAssuranceLevel, userHasVerifiedFactor } from "../lib/mfa";
import {
  CODE_COUNT,
  findMatchingRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../lib/mfa-recovery";

const router: ReturnType<typeof Router> = Router();

/**
 * Resolve the origin to send the user back to after a password reset.
 *
 * SECURITY: never trust the request's `Origin` header directly. It is
 * attacker-controllable, and Supabase appends the reset token to the
 * `redirectTo` URL — so echoing an arbitrary origin hands the reset token to
 * the attacker (audit SEC-P2-003 / CHAIN-P1-002).
 *
 * Only an origin from the configured CORS allowlist (or the canonical
 * APP_BASE_URL) is honoured. Anything else falls back to APP_BASE_URL.
 */
export function resolveTrustedRedirectOrigin(requestOrigin: string | undefined): string {
  const env = getEnv();
  const base = env.APP_BASE_URL ?? "http://localhost:3000";
  const fallback = base.replace(/\/+$/, "");

  if (!requestOrigin) return fallback;

  let normalized: string;
  try {
    normalized = new URL(requestOrigin).origin;
  } catch {
    return fallback;
  }

  if (normalized === fallback) return fallback;

  // CORS_ORIGIN is a comma-separated allowlist. "*" means allow-all for CORS
  // purposes and must NOT be read as "any origin is a trusted redirect target".
  if (env.CORS_ORIGIN === "*") return fallback;

  const allowed = env.CORS_ORIGIN.split(",").map((o) => o.trim().replace(/\/+$/, ""));
  if (allowed.includes(normalized)) return normalized;

  return fallback;
}

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

    // A verified TOTP factor means this aal1 session still owes its second
    // factor. Fail open (null => false) so a GoTrue blip cannot block sign-in.
    const mfaRequired = (await userHasVerifiedFactor(data.user.id)) === true;

    res.json(
      success({
        accessToken: data.session.access_token,
        user: { id: data.user.id, email: data.user.email },
        mfaRequired,
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
        // RES-P2-004: a hung GoTrue call must not hold the request forever.
        signal: AbortSignal.timeout(10_000),
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
      // RES-P2-004: bounded; a failure here is logged and does not block sign-in.
      signal: AbortSignal.timeout(10_000),
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
      // Only ever redirect to a trusted origin — never an echoed Origin header.
      redirectTo: `${resolveTrustedRedirectOrigin(req.headers.origin)}/password-reset`,
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

// --- MFA recovery codes ----------------------------------------------------
//
// GoTrue has no backup codes, so the portal stores 10 single-use scrypt-hashed
// codes per user. Spending one is a lost-device fallback: it deletes the
// remaining codes and unenrolls every verified TOTP factor, forcing a
// re-enrollment. There is no way to mint an `aal2` session from a recovery
// code, so unenroll is the only sound semantics.

/**
 * Blocks a request whose session owes a second factor. Mirrors the semantics
 * of `MFA_ENFORCEMENT_ENABLED` but scoped to factor/credential management:
 * a user with no verified factor is never blocked; an `aal2` session passes.
 */
async function requireAal2IfEnrolled(req: Request): Promise<void> {
  const hasFactor = await userHasVerifiedFactor(req.authUser!.userId);
  if (hasFactor === true && decodeAssuranceLevel(req.userJwt!) !== "aal2") {
    throw new AppError("MFA_REQUIRED", "Second factor required", 403);
  }
}

router.post("/mfa/recovery-codes", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    await requireAal2IfEnrolled(req);

    const hasFactor = await userHasVerifiedFactor(req.authUser!.userId);
    if (hasFactor !== true) {
      throw new AppError("VALIDATION", "Enroll an authenticator app first", 400);
    }

    const userId = req.authUser!.userId;
    const supabase = getSupabaseAdmin();

    // Regenerating invalidates every previous code (used and unused).
    const { error: deleteError } = await supabase
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", userId);
    if (deleteError) throw new AppError("INTERNAL", deleteError.message, 500);

    const codes = generateRecoveryCodes();
    const rowsToInsert = await Promise.all(
      codes.map(async (code) => {
        const { hash, salt } = await hashRecoveryCode(code);
        return { user_id: userId, code_hash: hash, salt };
      }),
    );
    const { error: insertError } = await supabase.from("mfa_recovery_codes").insert(rowsToInsert);
    if (insertError) throw new AppError("INTERNAL", insertError.message, 500);

    await logAuditEvent({
      actorUserId: userId,
      action: "auth.mfa.recovery_codes.generated",
      entityType: "user",
      entityId: userId,
      metadata: { count: codes.length },
    });

    // The plaintext codes are returned exactly once, here.
    res.status(201).json(success({ codes, remaining: CODE_COUNT }));
  } catch (error) {
    next(error);
  }
});

router.get("/mfa/recovery-codes", requireAuth, async (req, res, next) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("mfa_recovery_codes")
      .select("created_at, used_at")
      .eq("user_id", req.authUser!.userId);
    if (error) throw new AppError("INTERNAL", error.message, 500);

    const rows = data ?? [];
    const remaining = rows.filter((row) => row.used_at === null).length;
    const lastGeneratedAt = rows.reduce<string | null>((latest, row) => {
      if (!row.created_at) return latest;
      return !latest || row.created_at > latest ? row.created_at : latest;
    }, null);

    res.json(success({ remaining, total: CODE_COUNT, lastGeneratedAt }));
  } catch (error) {
    next(error);
  }
});

router.delete("/mfa/recovery-codes", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    await requireAal2IfEnrolled(req);

    const userId = req.authUser!.userId;
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("mfa_recovery_codes").delete().eq("user_id", userId);
    if (error) throw new AppError("INTERNAL", error.message, 500);

    await logAuditEvent({
      actorUserId: userId,
      action: "auth.mfa.recovery_codes.revoked",
      entityType: "user",
      entityId: userId,
    });

    res.json(success({ ok: true }));
  } catch (error) {
    next(error);
  }
});

router.post("/mfa/recovery", requireAuth, rateLimitAuth, async (req, res, next) => {
  try {
    const { code } = z.object({ code: z.string().min(6).max(16) }).parse(req.body);
    const userId = req.authUser!.userId;

    const hasFactor = await userHasVerifiedFactor(userId);
    if (hasFactor !== true) {
      throw new AppError("VALIDATION", "No authenticator app is enrolled", 400);
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("mfa_recovery_codes")
      .select("id, code_hash, salt")
      .eq("user_id", userId)
      .is("used_at", null);
    if (error) throw new AppError("INTERNAL", error.message, 500);

    const rows = data ?? [];
    const match = await findMatchingRecoveryCode(code, rows);
    if (!match) {
      await logAuditEvent({
        actorUserId: userId,
        action: "auth.mfa.recovery.failed",
        entityType: "user",
        entityId: userId,
      });
      throw new AppError("INVALID_RECOVERY_CODE", "Invalid recovery code", 401);
    }

    const { error: markError } = await supabase
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", match.id);
    if (markError) throw new AppError("INTERNAL", markError.message, 500);

    const { error: pruneError } = await supabase
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", userId)
      .neq("id", match.id);
    if (pruneError) throw new AppError("INTERNAL", pruneError.message, 500);

    type AdminFactor = { id: string; factor_type?: string; status?: string };
    const { data: factorData, error: factorError } = await supabase.auth.admin.mfa.listFactors({
      userId,
    });
    if (factorError) throw new AppError("AUTH_ERROR", factorError.message, 500);

    const factors = (factorData?.factors ?? []) as AdminFactor[];
    let factorsRemoved = 0;
    for (const factor of factors) {
      if (factor.factor_type === "totp" && factor.status === "verified") {
        const { error: deleteFactorError } = await supabase.auth.admin.mfa.deleteFactor({
          id: factor.id,
          userId,
        });
        if (deleteFactorError) throw new AppError("AUTH_ERROR", deleteFactorError.message, 500);
        factorsRemoved += 1;
      }
    }
    // The user now has no factor; drop the cached lookup so they are not held
    // at the step-up gate (or told MFA is required at sign-in) for 60s.
    clearMfaFactorCache();

    await logAuditEvent({
      actorUserId: userId,
      action: "auth.mfa.recovery.used",
      entityType: "user",
      entityId: userId,
      metadata: { factorsRemoved },
    });

    res.json(success({ ok: true, factorsRemoved }));
  } catch (error) {
    next(error);
  }
});

export default router;
