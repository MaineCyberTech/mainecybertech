# Phase 2 — Feature / Module / Folder Mapping

**Date:** 2026-06-26
**Auditor:** Comparative repo audit agent
**Reference Repo:** `C:\temp\chat` (chat-platform — real-time workspace communication)
**Current Repo:** `C:\temp\mainecybertech-portal` (MCT client portal — IT services management platform)

---

## 1. Mapping Summary

**Fundamental Relationship:**
- **Current Repo (MCT Portal)** appears to be an **evolved product** built upon the foundation of the **Reference Repo (Chat Platform)**
- **Core Architecture:** Both follow the same **hybrid monorepo pattern** with Turborepo, three main apps (API, Web, Worker), and shared packages
- **Architecture Maturity:** MCT Portal represents a **full-fledged MSP operations platform** that extends Chat Platform's real-time communication core

---

## 2. Folder-to-Folder Mapping

### Direct Equivalents
| Current Repo (MCT) | Reference Repo (Chat) | Relationship |
|-------------------|----------------------|--------------|
| `apps/web/` | `apps/web/` | **Functional Equivalent** - Next.js frontend |
| `apps/api/` | `apps/api/` | **Functional Equivalent** - Express API server |
| `apps/worker/` | `apps/worker/` | **Functional Equivalent** - Background worker |
| `packages/config/` | No clear equivalent | **New Addition** - Shared tooling config |
| `packages/ui/` | No equivalent | **New Addition** - UI component system |
| `packages/sdk/` | No equivalent | **New Addition** - Typed API client |
| `docs/` | `docs/` | **Parallel Documentation** - Both have comprehensive docs |
| `infra/` | `infra/` | **Structured Infrastructure** - Both have infra as code |

### Partial Equivalents
| Current Repo | Reference Repo | Relationship |
|-------------|---------------|------------|
| `apps/web/app/layout.tsx` | `apps/web/app/layout.tsx` | **Core Layout Structure** - Portal adds auth + admin routes |
| `apps/api/src/middleware.ts` | `apps/api/src/middleware.ts` | **Security Focus** - Portal adds tenant isolation, JWT verification |
| `apps/web/app/auth/` | `apps/web/app/auth/` | **Auth Flow** - Portal eliminates Supabase client in web |
| `packages/sdk/` (various modules) | No equivalent | **MCT Portal adds**: bulk operations, document sharing, notification preferences, billing, etc. |

### Renamed Equivalents
| Current Repo | Reference Repo | Rename Justification |
|-------------|---------------|---------------------|
| `apps/web/app/(portal)/` | `apps/web/app/` | **Namespace changes** - Portal organizes routes into portal/admin/public groups |
| `apps/web/app/(admin)/` | No equivalent | **New Structure** - Admin-specific pages not present in Chat |
| `apps/web/app/(public)/` | No equivalent | **New Structure** - Marketing/public pages added in Portal |
| `apps/api/src/routes/tickets/` | No equivalent | **Feature Evolution** - Tickets core to Portal, absent in Chat |

### Mismatched Folder Structures
**Portal's Organized Layout:**
```
apps/web/
├── app/
│   ├── (portal)/          # Portal routes (dashboard, support, etc.)
│   ├── (admin)/           # Admin routes (users, organizations, billing)
│   └── (public)/          # Marketing routes (home, contact, services)
├── components/            # UI components with variants
├── lib/                   # Client-side SDK, hooks, utils
└── e2e/                  # Comprehensive E2E tests
```

**Chat's Simpler Structure:**
```
apps/web/
├── app/
│   ├── login/
│   ├── workspace/
│   ├── channel/
│   └── ...
└── components/
└── lib/
└── utils/
```

---

## 3. Feature-to-Feature Mapping

### Core Features
| Feature Category | Current Repo (MCT) | Reference Repo (Chat) | Status |
|------------------|-------------------|----------------------|---------|
| **Real-Time Communication** | Chat / Messaging (full system) | Chat / Messaging (core system) | **Evolved** |
| **Authentication** | JWT + Supabase hybrid | Magic link + JWT middleware | **Enhanced** |
| **Authorization** | Role-based + tenant isolation | Workspace + channel permissions | **Advanced** |
| **Data Persistence** | Supabase + PostgreSQL | Supabase + PostgreSQL | **Equivalent** |
| **Real-Time Updates** | WebSockets + SSE + EventSource | Socket.io rooms + presence | **Extended** |

### Expanded Features (MCT Portal)
| Feature | MCT Portal | Chat Reference | Difference |
|---------|------------|----------------|------------|
| **Ticket System** | Full CRUD + bulk operations | No tickets | **Major Addition** |
| **Project Management** | Projects + timelines + tasks | No projects | **New Feature** |
| **Document Management** | Secure documents + sharing links | File uploads + storage | **Enhanced + Sharing** |
| **Organization Management** | Multi-tenant orgs + billing | Workspaces | **Replaced & Extended** |
| **Notification System** | Email + in-app + preferences | Chat + online presence | **Comprehensive** |
| **Billing System** | Stripe + invoicing + subscriptions | No billing | **New Feature** |
| **Audit Logging** | Full audit trail system | Basic audit logs | **Advanced** |

### Shared Operations
| Operation | MCT Portal | Chat Reference | Notes |
|-----------|------------|----------------|-------|
| **File Upload** | ✅ Vector files, images, documents | ✅ File uploads (chat attachments) | Portal: more robust + storage policies |
| **Search** | ✅ Full-text (tickets, documents, projects) | ✅ Full-text (messages) | Portal: broader scope |
| **Real-time Presence** | ✅ Online indicators + typing | ✅ Presence + typing | Enhanced in Portal |
| **Permissions** | ✅ Role-based + RLS | ✅ Workspace + channel | Portal: more granular |

---

## 4. Naming and Organizational Mismatches

### Package Naming
- **Shared Config:** MCT Portal has `@mct/config` vs Chat has no equivalent
- **UI Components:** MCT Portal has `@mct/ui` (cn utility) vs Chat has no equivalent
- **SDK:** MCT Portal has `@mct/sdk` (typed client) vs Chat has no equivalent

### Architecture Naming
```
Chat Platform:
- Core: "Chat Platform" (Slack/Discord inspired)
- Focus: Real-time communication

MCT Portal:
- Core: "Maine CyberTech Portal" (MSP operations)
- Focus: Business operations platform
```

### Documentation Structure
- **Chat:** Minimal docs (`README.md`, `AGENTS.md`)
- **MCT:** Comprehensive docs (`docs/` directory with 15+ files)

---

## 5. Missing in Current Repo (MCT Portal)

### Features Potentially Missing
1. **Simple Workspace-Based Organization** - MCT uses complex org model; Chat's workspaces were simpler
2. **Channels/Subchannels** - MCT has projects but not hierarchical channels like Chat
3. **Direct Messaging Focus** - MCT emphasizes tickets/projects; Chat was chat-centric
4. **Express-React Integration** - Both use same stack, but Chat may have different patterns
5. **Simple UI Components** - MCT may have over-engineered UI vs Chat's simplicity

---

## 6. Missing in Reference Repo (Chat)

### Features That Existed Earlier in MCT
1. **Ticket System** - Core to MCT, absent in Chat
2. **Document Sharing** - Advanced in MCT, basic uploads in Chat
3. **Bulk Operations** - MCT has bulk ticket/project ops; Chat had limited batch actions
4. **Notification Preferences** - MCT comprehensive; Chat basic chat notifications
5. **Billing System** - MCT core feature; Chat had none
6. **Audit Trail System** - MCT extensive logging; Chat basic logs
7. **Admin Dashboard** - MCT comprehensive; Chat limited admin views

---

## 7. Areas That Look Conceptually Similar but Architecturally Different

### Authentication Flow
**Chat Reference:**
- Magic link + JWT middleware
- Simpler callback flow

**MCT Portal:**
- Auth callback proxy (web forwards to API)
- Local JWT verification + Supabase fallback
- Elimination of Supabase client in web layer
- More robust session management

### Routing Architecture
**Chat Reference:**
- Flat `app/` route structure
- Workspace-centric: `/workspace/[slug]/channel/[id]`

**MCT Portal:**
- Nested route groups: `(portal)`, `(admin)`, `(public)`
- Domain routing: `app.*` → portal, `www.*` → marketing
- More complex route param handling
- Server components with Async params

### State Management
**Chat Reference:**
- Traditional client-side state
- Socket.io integration for real-time
- Simpler data flows

**MCT Portal:**
- Server components + Server Actions
- Client SDK pattern (`MCTClient.create()`)
- More complex client-server coordination
- Better SSR/SSG integration

### Testing Philosophy
**Chat Reference:**
- 15 unit tests (12 files)
- Simple E2E with Playwright
- Basic test patterns

**MCT Portal:**
- 695+ unit tests across all packages
- Comprehensive E2E (125+ tests)
- Advanced testing patterns:
  - Mock builder pattern
  - Async server component testing
  - Redirect mocking strategies
  - Custom DOM matchers

---

## 8. Areas That Cannot Yet Be Mapped Reliably

### Infrastructure Differences
- **Terraform Structure:** MCT has mature DO + Vercel IaC; Chat has basic terraform
- **Docker Strategy:** MCT uses multi-stage builds with optimizations; Chat has basic Dockerfile
- **CI/CD:** MCT has 7 GitHub workflows with gates; Chat has basic validate/build workflow

### Technology Stack Evolution
- **Package Management:** MCT uses pnpm 10+; Chat uses pnpm 9.15.4
- **Framework Versions:** MCT uses Next.js 15+; Chat likely uses earlier version
- **ESLint/TS:** MCT uses TypeScript 6.0+; Chat uses TypeScript 5.8

### Architectural Patterns
- **Error Boundaries:** MCT has comprehensive error boundaries; Chat may have minimal error handling
- **Caching Strategy:** MCT has response caching middleware; Chat has basic caching
- **Observability:** MCT has Sentry integration; Chat may have basic logging

### Development Approach
- **Documentation:** MCT is heavily documented; Chat is in AGENTS.md only
- **Code Review:** MCT has structured documentation processes; Chat doesn't specify
- **Testing Coverage:** MCT has 427 frontend tests; Chat has minimal tests

## Summary Mapping

**Conclusion:** The Current Repo (MCT Portal) represents a **significant evolution** from the Reference Repo (Chat Platform), transforming from a real-time communication platform into a comprehensive MSP operations platform while preserving and extending the core architectural patterns established in the reference implementation.

The mapping shows:
- **Strong Architecture DNA preserved** (monorepo, shared packages, test patterns)
- **Feature Expansion** (tickets, projects, documents, billing added)
- **Advanced Security** (tenant isolation, JWT verification, enterprise features)
- **Mature Infrastructure** (DO + Vercel, comprehensive CI/CD, Terraform)
- **Enhanced Developer Experience** (comprehensive docs, testing, tooling)

This is a clear case of **architecture bootstrap with feature expansion** rather than a complete reimplementation.