# Phase 3 — Super Admin

## Delivered

- Migration `0003_admin_implementation.sql`
  - business_brand, business_capabilities, workspace_configs
  - implementation_projects, implementation_tasks
  - business_internal_notes (staff-only)
  - owner fields on businesses

- Create Business (`/command/businesses/new`)
  - Creates tenant, subscription, brand, capabilities, location, workspace draft,
    implementation project + checklist, owner invitation token, audit event

- Businesses list + Business 360 shell (`/command/businesses`, `/command/businesses/[id]`)

## Preview UI

Set `NEXT_PUBLIC_PREVIEW_UI=true` (default in local `.env.local`).

Visit:

- `/preview` — hub
- `/login` — sign-in look
- `/app` — client workspace demo
- `/command` — Command Center demo

Preview is off in production unless `ALLOW_PREVIEW_UI=true`.
