import { ApiClient } from "./client";

export type SignInResult = {
  accessToken: string;
  user: { id: string; email: string | null };
};

export type SignUpResult = {
  user: { id: string; email: string | null } | null;
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
}