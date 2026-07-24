# Phases 4–10 — Implementation notes

## Delivered in platform code

| Area | Status |
|------|--------|
| Discovery questionnaire (client) + draft recommendation | UI + `@kasitech/workspace.recommendWorkspace` |
| Command discovery queue | Lists `discovery_questionnaires` when DB live |
| Workspace composer | Command draft from discovery signals |
| Dynamic nav / terminology / widgets | App shell via `loadWorkspaceNav` |
| Extension registry | `registerWidget` + `ensureWorkspaceExtensions` |
| CMS surfaces | Website + editor shells; public API v1 |
| Catalog / bookings / events / QR / service requests / customers | Module pages (preview data; DB tables in `0004`) |
| Analytics / support / settings / locations | Module pages |
| Invite accept | Token hash validation + membership activation |
| Payments abstraction | Manual provider stub (TZS-ready) |
| Hardening notes | `docs/operations/HARDENING.md` |

## Remaining with live Supabase

- Persist discovery answers and publish recommendations onto `workspace_configs`
- CMS draft → version → publish with revalidation
- Mutations for catalog/bookings/events (currently read/preview UX)
- Email delivery for invitations (Resend)
- Postgres RLS integration tests against staging
- Live TZ payment provider adapter
