# Auth

**Category:** Core
**API Routes:** `apps/api/src/routes/auth.ts`

## Overview

Authentication system handling the full lifecycle of user sessions. Implements Supabase Auth with PKCE flow, local JWT fast-path verification, password strength enforcement via zxcvbn, and secure cookie-based session management.

## Key Features

- PKCE-based OAuth flow with code exchange and session cookie
- zxcvbn password strength validation on sign-up and reset
- Local JWT verification (fast path) with Supabase fallback
- Secure `mct_session` cookie (HttpOnly, Secure, SameSite=Lax)
- Password reset flow (forgot-password + reset-password)
- Session invalidation on sign-out

## Endpoints

| Method | Path                         | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | /api/v1/auth/me              | Get current authenticated user      |
| POST   | /api/v1/auth/sign-in         | Sign in with email/password         |
| POST   | /api/v1/auth/sign-up         | Register new account                |
| POST   | /api/v1/auth/callback        | Exchange PKCE code for session      |
| POST   | /api/v1/auth/sign-out        | Invalidate session and clear cookie |
| POST   | /api/v1/auth/forgot-password | Send password reset email           |
| POST   | /api/v1/auth/reset-password  | Reset password with token           |

## Data Model

Key tables: `profiles` (user profile data), Supabase Auth users (identity, email, credentials)

## Access Control

- Public: sign-in, sign-up, callback, forgot-password, reset-password
- Authenticated: /me, sign-out
