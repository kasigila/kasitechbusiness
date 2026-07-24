# Security Risks & Controls

## Threat model (condensed)

| Threat | Impact | Control |
|--------|--------|---------|
| Cross-tenant data access (IDOR) | Critical | RLS + server TenantContext + isolation tests |
| Public account creation | High | No signup routes/APIs; invite-only |
| Service role leak to client | Critical | Server-only env; lint/review |
| Privilege escalation via role label | High | Permission keys checked server-side |
| Invitation replay | High | Hashed single-use tokens + expiry |
| XSS via CMS | High | Structured content only; no arbitrary HTML/JS/CSS |
| Malicious uploads | High | MIME/size/type checks; isolated storage paths |
| Webhook spoofing (billing) | High | Signature verify + idempotency (Phase 9) |
| Brute force login | Medium | Rate limit + Auth provider protections |
| Staff invisible backdoors | High | Explicit internal roles + audit; no silent impersonation |
| Mass assignment | Medium | Zod schemas; strip unknown fields |
| Existence leaks across tenants | Medium | Uniform NOT_FOUND |

## Phase 1 security deliverables

- [x] Architecture forbids public registration
- [ ] RLS enabled on all foundation tenant tables
- [ ] Membership-scoped policies + staff helpers
- [ ] Audit log append model
- [ ] `.env.example` without secrets
- [ ] Baseline isolation tests

## Logging redaction

Never log: passwords, access tokens, full card/mobile-money credentials, unnecessary PII.

## Spec-aligned non-negotiables

See master spec §97 — enforced as product principles in code review checklist.
