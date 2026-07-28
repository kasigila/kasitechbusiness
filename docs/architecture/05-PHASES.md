# Implementation Phases

Follow master spec §95. A phase is **done** only when §96 Definition of Done is met.

## PHASE 0 — Audit & architecture ✅ (this docs pack)

- Repository audit
- Architecture, schema, RLS, modules, services, lock-in, security, checklist

## PHASE 1 — Foundation (start immediately after docs)

- Monorepo scaffold
- Design system primitives
- DB migration: profiles, businesses, memberships, roles, permissions, invitations, audit, internal_roles
- RLS helpers + policies
- Supabase Auth wiring (email/password, reset, session)
- Login UI (no public registration)
- Permission seed + check helpers
- Audit write API
- Tenant isolation tests (baseline)
- CI: lint, typecheck, unit tests

## PHASE 2 — Commercial core

- Plans, features, plan_entitlements
- Subscriptions, addons, overrides
- Entitlement resolution service
- Seat / location limit enforcement hooks

## PHASE 3 — Super Admin

- Command Center dashboard (real metrics when data exists)
- Create Business flow (10-step side effects)
- Business 360 shell
- Implementation project stub

## PHASE 4 — Onboarding

- Discovery questionnaire + structured storage
- Workspace recommendation (draft)
- Owner invitations end-to-end
- Onboarding mode UX

## PHASE 5 — Workspace

- Dynamic nav / terminology / widgets / quick actions
- Workspace composer
- Branding display rules
- Widget registry + custom extension point

## PHASE 6 — CMS

- Sites, pages, sections, media
- Draft / preview / publish / versions
- Public published-content API contract
- Cache revalidation hooks

## PHASE 7 — Core business modules

- Catalog, bookings, events, customers, locations, team

## PHASE 8 — Advanced modules

- QR, tables, service requests, analytics, loyalty, campaigns, automation

## PHASE 9 — Billing & support

- Invoices, payments abstraction, upgrade requests
- Suspension lifecycle
- Support + professional services

## PHASE 10 — Production hardening

- Rate limits, monitoring, backups docs, security/E2E, a11y, staging, full docs

## After every phase

- Tests + tenant isolation verification
- Mobile check on primary flows
- Docs update
- Clean commit
