import { ApiClient } from "./client";

export type SignInResult = {
  accessToken: string;
  user: { id: string; email: string | null };
};

export type SignUpResult = {
  user: { id: string; email: string | null } | null;
};

export type MfaFactor = {
  id: string;
  friendlyName: string | null;
  status: string;
  createdAt?: string;
};

export type MfaFactorsResult = {
  totp: MfaFactor[];
  all: (MfaFactor & { factorType: string })[];
};

export type MfaEnrollResult = {
  factorId: string;
  type: string;
  friendlyName: string | null;
  qrCode: string;
  secret: string;
  uri: string;
};

export type MfaChallengeResult = {
  challengeId: string;
  expiresAt: number;
};

export type MfaVerifyResult = {
  accessToken: string;
  user: { id: string; email: string | null };
};

export class AuthApi {
  constructor(private client: ApiClient) {}

  signIn(email: string, password: string) {
    return this.client.post<SignInResult>("/api/v1/auth/sign-in", {
      email,
      password,
    });
  }

  signUp(email: string, password: string, fullName?: string) {
    return this.client.post<SignUpResult>("/api/v1/auth/sign-up", {
      email,
      password,
      fullName,
    });
  }

  signOut() {
    return this.client.post<{ ok: boolean }>("/api/v1/auth/sign-out");
  }

  forgotPassword(email: string) {
    return this.client.post<{ ok: boolean }>("/api/v1/auth/forgot-password", { email });
  }

  resetPassword(email: string, password: string) {
    return this.client.post<{ ok: boolean }>("/api/v1/auth/reset-password", { email, password });
  }

  exchangeCode(authCode: string, codeVerifier: string) {
    return this.client.post<{ session: { access_token: string } }>("/api/v1/auth/callback", {
      auth_code: authCode,
      code_verifier: codeVerifier,
    });
  }

  mfaFactors() {
    return this.client.get<MfaFactorsResult>("/api/v1/auth/mfa/factors");
  }

  mfaEnroll(friendlyName?: string) {
    return this.client.post<MfaEnrollResult>("/api/v1/auth/mfa/enroll", { friendlyName });
  }

  mfaChallenge(factorId: string) {
    return this.client.post<MfaChallengeResult>("/api/v1/auth/mfa/challenge", { factorId });
  }

  mfaVerify(factorId: string, challengeId: string, code: string) {
    return this.client.post<MfaVerifyResult>("/api/v1/auth/mfa/verify", {
      factorId,
      challengeId,
      code,
    });
  }

  mfaUnenroll(factorId: string) {
    return this.client.delete<{ ok: boolean }>(
      `/api/v1/auth/mfa/factors/${encodeURIComponent(factorId)}`,
    );
  }
}
