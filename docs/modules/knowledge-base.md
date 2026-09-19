# Client Knowledge Base

**Category:** Knowledge Management
**API Routes:** `apps/api/src/routes/knowledge-base.ts`
**SDK:** `packages/sdk/src/knowledge-base.ts`

## Overview

Searchable knowledge base of client-specific documentation — network diagrams, software licenses, vendor contacts, site credentials (encrypted), standard operating procedures, and onboarding guides. Organized by category and searchable via full-text index.

## Key Features

- Article CRUD with rich content (markdown body, category, tags)
- Multi-category taxonomy: network, software, credentials, vendor, procedure, onboarding
- Full-text search across title, body, and tags with relevance scoring
- Version tracking with diff view and restore capability
- Credential-type articles with field-level encryption for sensitive values
- Article linking — cross-reference related articles within the body
- Read tracking — mark articles as read with per-user acknowledgment

## Endpoints

| Method | Path                                         | Description                                                      |
| ------ | -------------------------------------------- | ---------------------------------------------------------------- |
| GET    | /api/v1/knowledge-base/articles              | List articles (paginated, filterable by org/category/tag/status) |
| POST   | /api/v1/knowledge-base/articles              | Create article                                                   |
| GET    | /api/v1/knowledge-base/articles/:id          | Get article with versions                                        |
| PATCH  | /api/v1/knowledge-base/articles/:id          | Update article                                                   |
| DELETE | /api/v1/knowledge-base/articles/:id          | Delete article                                                   |
| GET    | /api/v1/knowledge-base/search                | Full-text search across articles                                 |
| POST   | /api/v1/knowledge-base/articles/:id/read     | Mark article as read                                             |
| GET    | /api/v1/knowledge-base/articles/:id/versions | List version history                                             |
| POST   | /api/v1/knowledge-base/articles/:id/restore  | Restore previous version                                         |

## Data Model

`kb_articles` (organization_id, title, body_markdown, category, tags text[], status (draft/published/archived), is_credential, created_by, updated_at). `kb_article_versions` (article_id, version, body_markdown, created_by, created_at). `kb_article_reads` (article_id, user_id, read_at). Encrypted credential fields stored via pgcrypto in `kb_credentials` linked to article.

## Access Control

- Admin: full CRUD, version management, view all articles including credentials
- Client: read published articles, search, mark as read (credentials redacted)
- requireOrgAccess enforced; RLS via organization_id
- Audit logging on create, update, delete, version restore, and credential access
