# Database Schema Proposal

## Principles

1. Almost every tenant-owned row has `business_id uuid not null`.
2. Prefer relational columns for core domain; use `jsonb` for genuine configuration (workspace layout, section schemas, metadata).
3. Enable **RLS on create** for every tenant table.
4. Use `uuid` primary keys (`gen_random_uuid()`).
5. Soft status columns over hard deletes for commercial/identity records.
6. Indexes follow real query patterns: `(business_id)`, `(business_id, status)`, `(business_id, created_at desc)`.

## Phase 1 schema (foundation) — implement now

### Identity & access

```
profiles                 -- 1:1 with auth.users
businesses               -- tenants
business_memberships     -- user ↔ business
roles                    -- system + per-business templates
permissions              -- catalog
role_permissions
invitations
audit_logs
internal_roles           -- KasiTech staff platform roles
```

### Supporting Phase 1 enums / lookups

```
business_status: ONBOARDING | ACTIVE | PAST_DUE | GRACE_PERIOD | RESTRICTED | SUSPENDED | TERMINATED
membership_status: INVITED | ACTIVE | DEACTIVATED | REMOVED
invitation_status: PENDING | ACCEPTED | EXPIRED | REVOKED
```

### Core columns (abbreviated)

**profiles**
- `id` uuid PK (= auth.users.id)
- `full_name`, `email`, `phone`, `avatar_url`
- `is_kasitech_staff` boolean default false
- `mfa_enabled` boolean default false
- timestamps

**businesses**
- `id` uuid PK (immutable)
- `legal_name`, `display_name`, `slug` unique
- `primary_industry`, `description`
- `country` default `TZ`, `currency` default `TZS`, `timezone`
- `status`, `lifecycle_stage`
- `created_by` uuid
- timestamps

**business_memberships**
- `id`, `business_id`, `user_id`, `role_id`
- `status`, `invited_by`, `joined_at`
- unique `(business_id, user_id)` where status != REMOVED (partial unique)

**roles**
- `id`, `business_id` nullable (null = system template)
- `key` (BUSINESS_OWNER, …), `name`, `is_system`

**permissions**
- `key` text PK (e.g. `team.invite`), `description`, `category`

**invitations**
- `id`, `business_id`, `email`, `role_id`
- `token_hash` (store hash only), `expires_at`, `status`
- `invited_by`, `accepted_by`, `accepted_at`

**audit_logs**
- `id`, `business_id` nullable (platform actions may be null)
- `actor_user_id`, `actor_type` (USER | SYSTEM | STAFF)
- `action`, `resource_type`, `resource_id`
- `old_values` jsonb, `new_values` jsonb
- `ip`, `user_agent`, `request_id`
- `created_at` (append-only; no update/delete for non-service roles)

**internal_roles**
- `user_id`, `role` (KASITECH_SUPER_ADMIN | KASITECH_SUPPORT | KASITECH_IMPLEMENTATION)
- unique `(user_id, role)`

## Later phases (designed, not all migrated in Phase 1)

See master spec §77. Migration packs:

| Pack | Phase | Domains |
|------|-------|---------|
| `0001_foundation` | 1 | identity, tenancy, audit |
| `0002_commercial` | 2 | plans, features, subscriptions, addons, overrides |
| `0003_workspace` | 3–5 | brand, capabilities, terminology, workspace_*, discovery |
| `0004_implementation` | 3–4 | implementation_projects, tasks, assets, qa |
| `0005_cms` | 6 | website_*, media |
| `0006_operations` | 7–8 | catalog, bookings, events, qr, tables, customers |
| `0007_billing_support` | 9 | invoices, payments, tickets, pro_services |
| `0008_platform` | 8–10 | analytics, notifications, feature_flags, loyalty |

## JSONB usage policy

| Allowed | Not allowed as sole store |
|---------|---------------------------|
| Workspace widget layout | Memberships / roles |
| Section content payloads (validated by schema) | Prices / booking status |
| Discovery response structured answers | Invoice amounts |
| Feature flag targeting rules | Permission grants |

## Naming

- Tables: `snake_case` plural
- FK columns: `<entity>_id`
- Enum-like values: `SCREAMING_SNAKE` in text columns (or Postgres enums where stable)

## Money

Store monetary amounts as **integer minor units** (`amount_cents` / `amount_minor`) with explicit `currency` — TZS has no fractional subunit in practice but keep integer for consistency across currencies.
