# Master Build Checklist

Track completion across phases. Update statuses as work lands.

## Phase 0 — Architecture

- [x] Repository audit
- [x] Current architecture explained (greenfield)
- [x] Existing assets identified
- [x] Debt / security concerns listed
- [x] Spec gap analysis
- [x] Final architecture proposed
- [x] Database schema proposed
- [x] Tenancy / RLS strategy proposed
- [x] Folder / module structure proposed
- [x] Implementation phases proposed
- [x] External services identified
- [x] Vendor lock-in assessed
- [x] Security risks identified
- [x] Spec revisions noted
- [x] Checklist created

## Phase 1 — Foundation

- [x] Monorepo (pnpm + turbo) scaffolded
- [x] `@kasitech/ui` primitives (button, input, etc.)
- [x] `@kasitech/database` migrations 0001 foundation
- [x] RLS helpers + policies
- [x] `@kasitech/auth` session helpers
- [x] `@kasitech/permissions` catalog + checks
- [x] `@kasitech/audit` writer
- [x] `@kasitech/tenancy` context resolution
- [x] `@kasitech/validation` error types
- [x] Login / forgot-password pages (no signup)
- [x] Auth middleware route gates
- [x] Command route stub (staff-only)
- [x] App shell stub (member-only)
- [x] `.env.example`
- [x] Unit tests (permissions, tenancy helpers)
- [x] Isolation test skeleton
- [x] Lint + typecheck + test scripts
- [x] README + ops notes
- [x] CI workflow (lint/typecheck/test)

### Remaining Phase 1 polish

- [ ] Wire live Supabase project + apply migrations `0001` + `0002`
- [x] Load ActorContext from DB memberships in `/app` and `/command`
- [x] Enforce Command Center with `internal_roles` server-side (beyond middleware auth)
- [ ] Postgres RLS integration tests against staging DB
- [ ] Invitation email send path (Resend)

## Phase 2 — Commercial

- [x] Plans / features / entitlements schema
- [x] Entitlement resolver
- [x] Seat & location limit hooks
- [x] Seed Launch/Growth/Pro/Scale/Enterprise
- [x] Billing UX (plan, add-ons, usage, upgrade requests)
- [x] Team seats display + limit messaging
- [x] Command plans catalog view

## Phase 3 — Super Admin

- [x] Create Business flow (tenant + subscription + workspace + implementation + invite + audit)
- [x] Businesses list
- [x] Business 360 shell
- [x] Implementation project + tasks on create
- [x] UI preview mode for visual review without Supabase

## Phase 4 — Onboarding

- [ ] Discovery system
- [ ] Recommendations (unpublished)
- [ ] Owner invite E2E
- [ ] Onboarding mode UX

## Phase 5 — Workspace

- [ ] Dynamic navigation / terminology / widgets
- [ ] Workspace composer
- [ ] Extension registry

## Phase 6 — CMS

- [ ] Structured CMS + media
- [ ] Draft / preview / publish / versions
- [ ] Public content API v1
- [ ] Cache revalidation

## Phase 7 — Core modules

- [ ] Catalog, bookings, events, customers, locations, team

## Phase 8 — Advanced

- [ ] QR, tables, service requests, analytics, loyalty, campaigns, automation

## Phase 9 — Billing & support

- [ ] Billing abstraction + invoices/payments
- [ ] Upgrade requests
- [ ] Suspension policy states
- [ ] Support + professional services

## Phase 10 — Hardening

- [ ] Rate limits
- [ ] Monitoring / backups docs
- [ ] Full E2E critical path
- [ ] Accessibility pass
- [ ] Staging + production gates
- [ ] Operational runbooks

## Non-negotiables (always)

- [ ] No public registration
- [ ] No hard-coded customer names in shared logic
- [ ] No client-trusted business_id
- [ ] No service-role secrets client-side
- [ ] Tenant isolation tests green before release
