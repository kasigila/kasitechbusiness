# Proposed Final Architecture

## Product layers

```
┌─────────────────────────────────────────────────────────────┐
│ A. www.kasitechinnovations.com     (marketing — separate)   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ B. business.kasitechinnovations.com  ← THIS PLATFORM        │
│    /login  /onboarding  /app/*  /command/*  /api/*          │
└─────────────────────────────────────────────────────────────┘
          ▲ published content API (versioned, read-only)
          │
┌─────────┴───────────────────────────────────────────────────┐
│ C. Client sites (lido.co.tz, salon.co.tz, …)                │
│    Design owned by KasiTech; content from Business CMS      │
└─────────────────────────────────────────────────────────────┘
```

## Application topology

**Monorepo (pnpm + Turborepo)**

| App / package | Purpose |
|---------------|---------|
| `apps/business` | Single Next.js App Router app: auth, tenant workspace, Command Center (`/command`), public content APIs |
| `apps/worker` *(Phase 5+)* | Background jobs (Inngest or equivalent) |
| `packages/ui` | Design system |
| `packages/database` | Migrations, typed DB access, RLS helpers |
| `packages/auth` | Session, invitation, password-reset helpers |
| `packages/tenancy` | Tenant context resolution & guards |
| `packages/permissions` | Permission catalog + checks |
| `packages/entitlements` | Plan + addon + override resolution (Phase 2) |
| `packages/audit` | Tamper-resistant audit write API |
| `packages/validation` | Shared Zod schemas / API error shapes |
| `packages/workspace` | Navigation, terminology, widgets registry (Phase 5) |
| `packages/cms` | CMS domain (Phase 6) |
| Domain packages later | catalog, bookings, qr, customers, analytics, billing, notifications |

### Why one Next.js app for tenant + admin (Phase 1–5)

Spec §78 suggests `apps/admin`. We **logically separate** Command Center as `/command` with internal-role gates and no business nav links, while sharing packages. Split to `apps/admin` when operational isolation or deploy cadence demands it — without rewriting domain logic.

## Runtime stack

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 16 (App Router) + React 19 | Align with marketing site; RSC + server actions for secure mutations |
| Language | TypeScript strict | Maintainability |
| Styling | Tailwind 4 + `@kasitech/ui` | Shared tokens; calm B2B surface |
| Auth | Supabase Auth (email/password) | Spec-recommended; invitations + reset; MFA-ready |
| Database | Supabase Postgres | RLS-first tenancy; managed backups path |
| Storage | Supabase Storage | Tenant-scoped buckets + policies |
| Validation | Zod | Server-side schemas everywhere |
| Jobs | Inngest *(Phase 5+)* | Reliable retries without reinventing queues |
| Email | Resend *(or Postmark)* | Transactional invites / billing notices |
| Hosting | Vercel (app) + Supabase (data) | Matches existing KasiTech deploy muscle |
| Observability | Sentry + structured logs | Errors without leaking secrets |
| Payments | Provider-abstracted *(Phase 9)* | TZ mobile money / bank / card ready |

## Request / authorization flow

```
Browser
  → Next.js middleware (session present? route class?)
  → Server Action / Route Handler
      1. authenticate (Supabase session)
      2. resolve ActorContext { userId, memberships, internalRoles }
      3. resolve TenantContext { businessId, role, permissions, entitlements }
      4. authorize (permission + entitlement)
      5. data access with tenant-scoped queries (RLS still enforced)
      6. audit sensitive actions
      7. return typed Result | PlatformError
```

**Never trust client-supplied `business_id`.** Active business comes from:

1. Membership-verified cookie/session preference, **and**
2. Server re-check that the user has an **active** membership for that business.

## Mode model

| Mode | Who | UX |
|------|-----|----|
| `ONBOARDING` | Client after invite, pre-LIVE | Progress, tasks, discovery — no empty ops modules |
| `ACTIVE` | After KasiTech marks LIVE | Configured workspace |
| `RESTRICTED` / `SUSPENDED` | Billing policy | Policy-driven capability cuts; data retained |
| `COMMAND` | Internal roles only | Super Admin Command Center |

## Extension model (custom work without forks)

1. **Configuration** — workspace nav, widgets, terminology, capabilities (80%).
2. **Registered extensions** — `registerWidget()`, `registerModule()` keyed by `business_id` or capability (15%).
3. **Bespoke engineering** — new package under feature flag + tenant registration (5%).

Hard rule: no `if (business.name === 'Lido')` in shared code.

## API error contract

```ts
type PlatformErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'          // also used for cross-tenant (no existence leak)
  | 'VALIDATION_ERROR'
  | 'PLAN_LIMIT_REACHED'
  | 'FEATURE_NOT_AVAILABLE'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';
```

Cross-tenant IDOR attempts return **NOT_FOUND**, not UNAUTHORIZED, for private resources.

## Environments

| Env | App URL | Supabase project | Notes |
|-----|---------|------------------|-------|
| local | localhost:3000 | local / dedicated dev | Seed demos |
| staging | staging.business… | staging project | Realistic data, fake payments |
| production | business.kasitechinnovations.com | production | Strict secrets, CI gates |

## Coherence decisions (locked for Phase 1)

1. **Greenfield** — no legacy migration.
2. **Supabase Auth + Postgres RLS** as tenancy backbone.
3. **`business_memberships`** as sole user↔tenant link (users may have many; UX defaults to one).
4. **No public signup routes or APIs** — admin create + invitation only.
5. **Command Center** at `/command`, not in business sidebar.
6. **SQL migrations** versioned in `packages/database/migrations`.
7. **Phase order** follows master spec §95.
