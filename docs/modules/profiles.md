# Profiles

**Category:** Core
**API Routes:** `apps/api/src/routes/profiles.ts`
**SDK:** `packages/sdk/src/profiles.ts`

## Overview

User profile management with avatar upload to Supabase Storage. Supports viewing, updating profile fields with optimistic locking, and avatar management.

## Key Features

- Profile viewing by ID
- Optimistic locking on profile updates (version field)
- Avatar upload to Supabase Storage bucket
- Cross-reference with Supabase Auth user data
- Name, phone, and title fields

## Endpoints

| Method | Path                        | Description                         |
| ------ | --------------------------- | ----------------------------------- |
| GET    | /api/v1/profiles            | List all profiles                   |
| GET    | /api/v1/profiles/:id        | Get profile by ID                   |
| PATCH  | /api/v1/profiles/:id        | Update profile (optimistic locking) |
| POST   | /api/v1/profiles/:id/avatar | Upload avatar image                 |

## Data Model

Key fields: `id`, `email`, `full_name`, `phone`, `title`, `avatar_url`, `version`, `created_at`, `updated_at`

## Access Control

- Authenticated: can view profiles and update own profile
- Admin: can update any profile
