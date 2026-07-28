# Tenancy & RLS Strategy

## Model

```
auth.users ──1:1── profiles
                 │
                 ├── internal_roles (KasiTech staff only)
                 │
                 └── business_memberships ──► businesses
                              │
                              └── roles ──► role_permissions ──► permissions
```

A user’s active tenant is **not** a mutable `business_id` on the auth user. It is a membership row.

## Isolation rules

A principal may access a tenant row only if **all** hold:

1. Authenticated (`auth.uid()` present)
2. Active membership for `row.business_id`, **or** explicitly authorized staff path
3. Permission permits the operation
4. Entitlement permits the feature (Phase 2+)

Staff access:

- Uses `internal_roles`, never silent “superuser bypass” in client code
- Service role used only in trusted server environments
- Support access must be audited (Phase 9 controlled access)

## Postgres RLS pattern

Enable RLS on every tenant table. Example policy sketch:

```sql
-- Helper: active membership
create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.business_memberships m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

-- Helper: kasitech staff
create or replace function public.is_kasitech_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.internal_roles r
    where r.user_id = auth.uid()
  );
$$;

-- Example tenant select
create policy businesses_select on public.businesses
for select to authenticated
using (
  public.is_business_member(id)
  or public.is_kasitech_staff()
);
```

### Write policies

- **INSERT/UPDATE/DELETE** by members require permission checks either:
  - in stricter RLS (`has_permission(...)`), **and/or**
  - in the application data-access layer (defense in depth)

Phase 1 implements helper functions + membership-scoped RLS. Permission-aware RLS functions expand in Phase 1/2 as permission seed lands.

### Audit logs

- INSERT allowed for authenticated actors via `security definer` RPC / service path
- SELECT: staff see platform-wide; members see own business only
- No UPDATE/DELETE for `authenticated` role

### Invitations

- Token plaintext never stored; store `token_hash`
- Accept flow uses single-use transition PENDING → ACCEPTED inside a transaction

## Application tenancy context

```ts
type TenantContext = {
  userId: string;
  businessId: string;
  membershipId: string;
  roleKey: string;
  permissions: Set<string>;
  // entitlements added Phase 2
};
```

Data access signature convention:

```ts
getSomething({ ctx: TenantContext, id: string })
```

Not:

```ts
getSomething(id, businessIdFromClient)
```

## Mandatory isolation test (Phase 1+)

User A (Business A) must be unable to read/modify/delete/export/infer Business B data via:

- manipulated URLs
- API/body `business_id`
- direct IDs
- storage paths

Cross-tenant probes assert **NOT_FOUND** / empty / denied consistently.

## Storage isolation

Media paths: `businesses/{business_id}/...`  
Storage policies mirror membership checks. Never serve another tenant’s private objects.
