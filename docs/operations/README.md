# Operations notes (Phase 1)

## Environments

| Env | Purpose |
|-----|---------|
| local | Developer machines + optional local Supabase |
| staging | Pre-production validation |
| production | business.kasitechinnovations.com |

Never point destructive tests at production.

## Secrets

- Store secrets in the host env / Vercel / Supabase dashboard.
- `.env.example` lists names only.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.

## Migration procedure

1. Review SQL in `packages/database/migrations/`.
2. Apply to staging first.
3. Run isolation / permission smoke checks.
4. Apply to production during a controlled window.
5. Record migration in release notes.

## Backup / restore (target)

Document concrete RPO/RTO once Supabase production project exists (Phase 10). Until then:

- Enable Supabase automated backups on paid plan before client launch.
- Quarterly restore drill checklist will live in this folder.

## Incident basics

1. Capture error ID / request correlation if present.
2. Do not paste tokens or passwords into tickets.
3. Prefer revoke session / rotate keys over silent patches when auth is involved.
