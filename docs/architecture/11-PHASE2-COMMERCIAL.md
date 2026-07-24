# Phase 2 — Commercial Core

## Delivered

- Migration `packages/database/migrations/0002_commercial.sql`
  - plans, features, plan_entitlements
  - addons, addon_entitlements
  - subscriptions, subscription_items
  - business_addons, business_entitlement_overrides
  - upgrade_requests
  - locations (for location limits)
  - RLS on all tables
  - Seeded Launch / Growth / Pro / Scale / Enterprise + add-ons

- Package `@kasitech/entitlements`
  - `resolveEntitlements` = plan + add-ons + overrides
  - `checkLimit` / `assertFeatureEnabled` with `PLAN_LIMIT_REACHED` / `FEATURE_NOT_AVAILABLE`
  - Upgrade suggestions (Team Pack, next plan, etc.)

- App surfaces
  - `/app/billing` — plan, add-ons, usage, request upgrade/add-on
  - `/app/team` — seats `used / limit` + limit messaging
  - `/command/plans` — internal catalog view
  - Seat/location enforcement helpers for future invite/create flows

## Apply migrations

```bash
# In Supabase SQL editor or CLI, run in order:
packages/database/migrations/0001_foundation.sql
packages/database/migrations/0002_commercial.sql
```

## Resolution formula

```
BASE PLAN entitlements
+ ADD-ON entitlements (add | max | replace | enable)
+ AUTHORIZED OVERRIDES (non-expired)
= EFFECTIVE ENTITLEMENTS
```

Upgrades are **requests** only — no silent charge or plan change.
