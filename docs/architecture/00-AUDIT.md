# Phase 0 — Repository Audit

**Repository:** `kasigila/kasitechbusiness`  
**Date:** 2026-07-24  
**Branch audited:** `main` (`c2bbfea`)

---

## 1. Current state

| Item | Finding |
|------|---------|
| Application code | **None** — greenfield |
| Files on `main` | `README.md` only (`# kasitechbusiness`) |
| Auth system | None |
| Database | None |
| Deploy pipeline | None |
| Tests | None |
| Dependencies | None |
| Secrets / env | None |

This repository is an empty shell created for KasiTech Business. There is **no working functionality to preserve** and **no conflicting legacy tenancy model**.

---

## 2. Related KasiTech systems

| System | Repo / URL | Role | Stack |
|--------|------------|------|-------|
| Public marketing site | `kasigila/kasitech` → [kasitechinnovations.com](https://kasitechinnovations.com) (Vercel) | Layer A — marketing, sales, consultations | Next.js 16.2, React 19, Tailwind 4, TypeScript, Framer Motion |
| KasiTech Business | **this repo** → business.kasitechinnovations.com | Layer B — multi-tenant operating platform | *to be built* |
| Client public websites | e.g. lido.co.tz | Layer C — tenant-branded sites consuming published CMS content | *separate projects; consume Business public API* |

### Marketing site brand signals (reuse for product consistency)

- Colors: `--kasi-black #090909`, `--kasi-ivory #f4f2ea`, `--kasi-green #c7ff00`, `--kasi-grey #929292`
- Fonts: Space Grotesk (sans), Outfit (display), JetBrains Mono (mono)
- Tone: premium, calm, high-trust — not template SaaS purple

**Important:** Business product UI should share brand DNA but use a **calmer B2B operating-surface treatment** (light workspace chrome, restrained accent). Do not recreate the full dark marketing hero aesthetic as the daily dashboard skin.

---

## 3. What already exists that is reusable

| Asset | Reuse plan |
|-------|------------|
| Brand tokens & fonts | Port as CSS variables into `@kasitech/ui` |
| Logo assets | Copy/reference from marketing `public/brand` when available |
| Company domain / positioning | Login footer + “Visit KasiTech Innovations” CTA |
| Next.js + Tailwind conventions | Align Business app to same major versions |

Nothing in this repo is reusable yet. No shared packages exist across repos today.

---

## 4. Technical debt / security concerns (pre-build)

Because the repo is empty, debt is **prospective**. Risks we must avoid from day one:

1. **Hard-coded tenant logic** (`if business.slug === 'lido'`) — forbidden by spec §9 / §97.
2. **Client-trusted `business_id`** — every query must derive tenant from server auth + membership.
3. **Service-role keys in the browser** — never.
4. **Public registration** — must never appear in UI or API.
5. **RLS as afterthought** — enable RLS on every tenant table in the same migration that creates it.
6. **Monolith UI coupling** — modules must be package-bounded so custom widgets register, not fork.
7. **Payment provider hard-coupling** — abstract billing before first webhook.
8. **Marketing-site coupling** — Business must not depend on marketing demo routes or static content.

---

## 5. Spec vs existing system (gap analysis)

| Spec area | Status |
|-----------|--------|
| Multi-tenant tenancy | Missing — greenfield |
| No public registration | Missing — must implement as default |
| Auth / memberships / roles | Missing |
| RLS | Missing |
| Plans / entitlements | Missing (Phase 2) |
| Super Admin / Create Business | Missing (Phase 3) |
| Discovery / onboarding | Missing (Phase 4) |
| Workspace composer | Missing (Phase 5) |
| CMS / publish | Missing (Phase 6) |
| Catalog / bookings / etc. | Missing (Phases 7–8) |
| Billing / support | Missing (Phase 9) |
| Hardening / CI / docs | Missing (Phase 10) |

**Conflict with specification:** none — empty slate.

---

## 6. Audit conclusion

Proceed with **Phase 0 architecture lock-in**, then **Phase 1 foundation** in this repository.

No migration of legacy Business code is required. Align stack choices with the existing marketing Next.js ecosystem while introducing Supabase (Postgres + Auth + Storage + RLS) as the operational data plane.
