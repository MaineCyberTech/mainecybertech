# Identity Verification Anti-Vishing

**Category:** Security
**API Routes:** `apps/api/src/routes/identity-verification.ts`
**SDK:** `packages/sdk/src/identity-verification.ts`

## Overview

Anti-vishing identity verification system for phone-based support interactions. Generates time-limited verification codes, records verification attempts, and maintains an audit trail of caller identity challenges to prevent social engineering attacks.

## Key Features

- Verification code generation — 6-digit numeric codes with configurable TTL (default 5 minutes)
- Multi-channel delivery — SMS, email, or authenticator app push with delivery status tracking
- Code verification with rate limiting (max 5 attempts before lockout)
- Verification attempt audit log — caller identity, method, success/failure, IP, timestamp
- Known-caller whitelist management per org with automatic bypass for trusted numbers
- Suspicious activity flagging — repeated failures from same number flagged for review

## Endpoints

| Method | Path                                              | Description                                                    |
| ------ | ------------------------------------------------- | -------------------------------------------------------------- |
| POST   | /api/v1/identity-verification/generate            | Generate and send verification code                            |
| POST   | /api/v1/identity-verification/verify              | Verify submitted code                                          |
| GET    | /api/v1/identity-verification/attempts            | List verification attempts (filterable by org/user/date-range) |
| POST   | /api/v1/identity-verification/trusted-numbers     | Add trusted caller number                                      |
| GET    | /api/v1/identity-verification/trusted-numbers     | List trusted numbers                                           |
| DELETE | /api/v1/identity-verification/trusted-numbers/:id | Remove trusted number                                          |
| GET    | /api/v1/identity-verification/flags               | List flagged suspicious attempts                               |

## Data Model

`identity_verification_codes` (organization_id, user_id, phone_number, email, code_hash, method (sms/email/app), expires_at, attempts, verified_at, created_at). `identity_verification_attempts` (organization_id, caller_phone, method, result (success/failure), ip_address, user_agent, created_at). `identity_trusted_numbers` (organization_id, phone_number, label, added_by, created_at).

## Access Control

- Admin: view all attempts, manage trusted numbers, review flagged activity
- Client: trigger verification on their own account, view own attempt history
- requireAuth + requireOrgAccess; RLS via organization_id
- Audit logging on generate, verify (success + failure), and trusted number changes
