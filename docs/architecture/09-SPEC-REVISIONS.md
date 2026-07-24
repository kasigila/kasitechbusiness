# Spec Revisions Recommended Before / During Build

The master specification is strong. These are **clarifications**, not dilutions.

## 1. Admin app packaging

**Spec:** `apps/admin` separate.  
**Proposal:** Start with `/command` inside `apps/business`, same packages. Split apps when deploy isolation requires it.  
**Why:** Same auth/DB; faster Phase 1–3 without duplicate Next configs.

## 2. Permission enforcement locus

**Spec:** granular permissions + RLS.  
**Proposal:** Phase 1 RLS = membership (+ staff). Permission checks in application layer + `has_permission()` SQL helper seeded; tighten write RLS policies incrementally so migrations stay reviewable.  
**Why:** Giant permission RLS matrices are error-prone on day one; defense in depth still holds.

## 3. Money & TZS

**Spec:** TSh plan prices.  
**Proposal:** Integer amounts + `currency` code; display layer formats TZS. Plans editable in DB (Phase 2), seed values match Launch/Growth/Pro/Scale.  
**Why:** Avoid float money; support Enterprise custom.

## 4. MFA timing

**Spec:** prepare for MFA especially for admins/owners.  
**Proposal:** Schema flag `mfa_enabled` Phase 1; enforce MFA for `internal_roles` before production cutover (Phase 10 gate).  
**Why:** Supabase MFA available; don’t block foundation.

## 5. Realtime for table service

**Spec:** realtime where appropriate.  
**Proposal:** Polling acceptable for MVP of service requests; add Supabase Realtime as enhancement behind feature flag.  
**Why:** Correctness via DB first.

## 6. Public content API versioning

**Spec:** stable contracts for client sites.  
**Proposal:** `/api/v1/public/...` with site token or domain binding; never expose drafts.  
**Why:** Protect 100 client sites from internal schema churn.

## 7. “Infer private information”

**Spec:** isolation tests include inference.  
**Proposal:** Define as: timing-safe NOT_FOUND, no enumeration endpoints, no cross-tenant search, uniform error shapes. Full side-channel lab testing is out of Phase 1 scope but error uniformity is in.  

## 8. Demo tenants

**Proposal:** Seed only in local/staging. Production never auto-seeds client-like demos with confusing billing.

## 9. Marketing site relationship

Business platform must **not** import marketing demo code. Shared brand tokens may be duplicated or published as a tiny private package later — avoid tight git submodule coupling for now.

## 10. What we will not change

- No public registration
- One multi-tenant app
- Server-side entitlements
- RLS on tenant data
- Configuration over hard-coded customer names
- Invite-only business users
- Soft suspension without data destruction
