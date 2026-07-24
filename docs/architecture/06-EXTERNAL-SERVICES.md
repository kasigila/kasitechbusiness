# External Services & Packages

## Required / planned services

| Service | Phase | Why |
|---------|-------|-----|
| **Supabase** (Auth, Postgres, Storage) | 1 | Auth + RLS tenancy + media isolation |
| **Vercel** | 1 | Host Next.js app; preview deploys; aligns with marketing site |
| **Resend** (or Postmark) | 1–4 | Invitation + password + transactional email |
| **Sentry** | 1 / 10 | Error tracking without secret leakage |
| **Inngest** (or Trigger.dev) | 5+ | Background jobs with retries/idempotency |
| **Payment provider(s)** | 9 | TZ-ready abstraction: mobile money, bank, card, manual |
| **DNS / domains** | 6+ | Client domain connection workflows |

## Core npm packages (Phase 1)

| Package | Why |
|---------|-----|
| `next`, `react`, `react-dom` | App framework |
| `typescript`, `zod` | Types + validation |
| `@supabase/supabase-js`, `@supabase/ssr` | Auth/DB clients for Next |
| `tailwindcss` | Styling |
| `clsx` / `tailwind-merge` | Class composition |
| `vitest` | Unit/integration tests |
| `turbo`, `pnpm` | Monorepo tooling |
| `lucide-react` | Consistent icons (composer-selectable later) |

## Why not…

| Alternative | Decision |
|-------------|----------|
| Firebase | Weaker Postgres RLS story; less fit for relational tenancy |
| Clerk / Auth0 alone | Extra vendor; still need Postgres RLS discipline — Supabase Auth colocates |
| Prisma only | Fine later for DX, but RLS + Supabase migrations are first-class with SQL; start SQL-first |
| Hard-code M-Pesa SDK in UI | Violates billing abstraction (§44) |

## Local development

- Supabase CLI for local Postgres + Auth when available
- `.env.example` documents variable **names only**
- Seed script creates demo tenants with **fake** data only (§71)
