# KasiTech Business

Commercial multi-tenant B2B SaaS platform for KasiTech clients.  
**Domain:** [business.kasitechinnovations.com](https://business.kasitechinnovations.com)

> Private operating platform — **no public registration**. Businesses are created by KasiTech administrators; users enter by invitation only.

## Status

| Phase | State |
|-------|--------|
| Phase 0 — Architecture | Complete (`docs/architecture/`) |
| Phase 1 — Foundation | Core complete; live Supabase wiring pending |
| Phase 2 — Commercial | Schema, entitlements, billing/team UX landed |
| Phase 3 — Super Admin | Create Business + Business 360 + preview UI |
| Phases 4–10 | Planned |

## Architecture docs

Start here:

1. [`docs/architecture/00-AUDIT.md`](docs/architecture/00-AUDIT.md)
2. [`docs/architecture/01-ARCHITECTURE.md`](docs/architecture/01-ARCHITECTURE.md)
3. [`docs/architecture/10-CHECKLIST.md`](docs/architecture/10-CHECKLIST.md)

## Stack

- **Apps:** Next.js 16 (App Router) + React 19 — `apps/business`
- **Data/Auth:** Supabase (Postgres + Auth + RLS + Storage)
- **Monorepo:** pnpm + Turborepo
- **UI:** `@kasitech/ui` (KasiTech brand DNA, calm B2B surface)

## Develop

```bash
pnpm install
cp .env.example apps/business/.env.local   # fill Supabase keys when ready
pnpm dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

Without Supabase env vars, the login UI still renders; sign-in returns a configuration error (by design).

### Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Database

Apply foundation migration to your Supabase project:

`packages/database/migrations/0001_foundation.sql`

## Product principles (non-negotiable)

1. No public registration  
2. One platform, many tenants  
3. Tenant isolation enforced server-side and with Postgres RLS  
4. No hard-coded customer names in shared product logic  
5. Entitlements enforced on the backend (Phase 2+)  

## Packages

| Package | Role |
|---------|------|
| `@kasitech/business` | Next.js app (login, workspace shell, Command Center stub) |
| `@kasitech/ui` | Design system |
| `@kasitech/database` | SQL migrations + types |
| `@kasitech/auth` | Auth policy + invitation tokens |
| `@kasitech/tenancy` | Tenant context resolution |
| `@kasitech/permissions` | Permission catalog |
| `@kasitech/entitlements` | Plan/add-on/override resolution + limits |
| `@kasitech/audit` | Audit event types/writer |
| `@kasitech/validation` | Shared result/error contract |
