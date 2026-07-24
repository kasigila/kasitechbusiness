# Hardening & production gates

## Before first real tenant

1. Apply migrations `0001`–`0004` on a dedicated Supabase project.
2. Set env vars from `.env.example` (never commit secrets).
3. Disable preview UI (`NEXT_PUBLIC_PREVIEW_UI` unset; never set `ALLOW_PREVIEW_UI` in production).
4. Confirm middleware blocks `/signup`, `/register`, and similar public auth routes.
5. Provision the first Super Admin via `internal_roles` (no self-serve).
6. Run Create Business → owner invite → accept → onboarding once end-to-end.

## Security checklist

- Service role key only on the server (`createAdminClient` / `createServiceClient`).
- Tenant `business_id` always derived from membership / ActorContext — never trusted from the client alone.
- Entitlements enforced server-side before privileged mutations.
- Audit logs written for create business, invite accept, entitlement overrides.
- Public CMS API returns only `PUBLISHED` pages.

## Observability (next)

- Structured logs for auth failures and invite accept errors.
- Uptime check on `/login` and `/api/v1/public/.../content`.
- Database backups via Supabase scheduled backups + documented restore drill.

## Payments

- Use `apps/business/src/lib/payments` abstraction only.
- Keep `ManualPaymentProvider` for offline TZS recording until M-Pesa/card is wired.
- Do not store card PANs in application tables.

## Rate limits / abuse

- Rely on Supabase Auth rate limits for login.
- Add edge rate limiting on public content API before high traffic.
- Invitation tokens are single-use hashes; raw tokens never stored.
