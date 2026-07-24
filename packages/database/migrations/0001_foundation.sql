-- KasiTech Business — Phase 1 foundation
-- Identity, tenancy, roles, permissions, invitations, audit, RLS

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Updated-at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  avatar_url text,
  is_kasitech_staff boolean not null default false,
  mfa_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on auth signup (invite acceptance / admin-provisioned)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Businesses (tenants)
-- ---------------------------------------------------------------------------
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  display_name text not null,
  slug text not null,
  primary_industry text,
  description text,
  country text not null default 'TZ',
  currency text not null default 'TZS',
  timezone text not null default 'Africa/Dar_es_Salaam',
  primary_address text,
  primary_phone text,
  whatsapp text,
  email text,
  existing_website text,
  status text not null default 'ONBOARDING'
    check (status in (
      'ONBOARDING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD',
      'RESTRICTED', 'SUSPENDED', 'TERMINATED'
    )),
  lifecycle_stage text not null default 'BUSINESS_CREATED',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint businesses_slug_unique unique (slug)
);

create index businesses_status_idx on public.businesses (status);
create index businesses_created_at_idx on public.businesses (created_at desc);

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------------
create table public.permissions (
  key text primary key,
  description text not null,
  category text not null
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  key text not null,
  name text not null,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, key)
);

-- System templates: business_id IS NULL
create unique index roles_system_key_unique
  on public.roles (key)
  where business_id is null;

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_id, permission_key)
);

-- ---------------------------------------------------------------------------
-- Memberships
-- ---------------------------------------------------------------------------
create table public.business_memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id uuid not null references public.roles (id),
  status text not null default 'INVITED'
    check (status in ('INVITED', 'ACTIVE', 'DEACTIVATED', 'REMOVED')),
  invited_by uuid references public.profiles (id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index business_memberships_active_unique
  on public.business_memberships (business_id, user_id)
  where status <> 'REMOVED';

create index business_memberships_user_idx
  on public.business_memberships (user_id, status);

create index business_memberships_business_idx
  on public.business_memberships (business_id, status);

create trigger business_memberships_set_updated_at
before update on public.business_memberships
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Internal KasiTech roles
-- ---------------------------------------------------------------------------
create table public.internal_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null
    check (role in (
      'KASITECH_SUPER_ADMIN',
      'KASITECH_SUPPORT',
      'KASITECH_IMPLEMENTATION'
    )),
  granted_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- ---------------------------------------------------------------------------
-- Invitations (store token hash only)
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles (id),
  token_hash text not null unique,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  expires_at timestamptz not null,
  invited_by uuid references public.profiles (id),
  accepted_by uuid references public.profiles (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invitations_business_idx on public.invitations (business_id, status);
create index invitations_email_idx on public.invitations (lower(email));

create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Audit logs (append-oriented)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  actor_user_id uuid references public.profiles (id) on delete set null,
  actor_type text not null check (actor_type in ('USER', 'SYSTEM', 'STAFF')),
  action text not null,
  resource_type text not null,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip text,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now()
);

create index audit_logs_business_created_idx
  on public.audit_logs (business_id, created_at desc);

create index audit_logs_actor_created_idx
  on public.audit_logs (actor_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------
create or replace function public.is_kasitech_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.internal_roles r
    where r.user_id = auth.uid()
  );
$$;

create or replace function public.is_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships m
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
  );
$$;

create or replace function public.has_business_permission(
  p_business_id uuid,
  p_permission text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_memberships m
    join public.role_permissions rp on rp.role_id = m.role_id
    where m.business_id = p_business_id
      and m.user_id = auth.uid()
      and m.status = 'ACTIVE'
      and rp.permission_key = p_permission
  );
$$;

revoke all on function public.is_kasitech_staff() from public;
revoke all on function public.is_business_member(uuid) from public;
revoke all on function public.has_business_permission(uuid, text) from public;
grant execute on function public.is_kasitech_staff() to authenticated;
grant execute on function public.is_business_member(uuid) to authenticated;
grant execute on function public.has_business_permission(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.business_memberships enable row level security;
alter table public.internal_roles enable row level security;
alter table public.invitations enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles
create policy profiles_select_self_or_staff on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_kasitech_staff());

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Businesses
create policy businesses_select_member_or_staff on public.businesses
for select to authenticated
using (public.is_business_member(id) or public.is_kasitech_staff());

create policy businesses_insert_staff on public.businesses
for insert to authenticated
with check (public.is_kasitech_staff());

create policy businesses_update_staff_or_settings on public.businesses
for update to authenticated
using (
  public.is_kasitech_staff()
  or public.has_business_permission(id, 'settings.edit')
)
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(id, 'settings.edit')
);

-- Permissions catalog (read-only for authenticated)
create policy permissions_select_authenticated on public.permissions
for select to authenticated
using (true);

-- Roles
create policy roles_select on public.roles
for select to authenticated
using (
  business_id is null
  or public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy roles_write_staff on public.roles
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

-- Role permissions
create policy role_permissions_select on public.role_permissions
for select to authenticated
using (
  exists (
    select 1 from public.roles r
    where r.id = role_id
      and (
        r.business_id is null
        or public.is_business_member(r.business_id)
        or public.is_kasitech_staff()
      )
  )
);

create policy role_permissions_write_staff on public.role_permissions
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

-- Memberships
create policy memberships_select on public.business_memberships
for select to authenticated
using (
  user_id = auth.uid()
  or public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy memberships_insert_staff_or_team on public.business_memberships
for insert to authenticated
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.invite')
);

create policy memberships_update_staff_or_team on public.business_memberships
for update to authenticated
using (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.manage_roles')
  or public.has_business_permission(business_id, 'team.remove')
)
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.manage_roles')
  or public.has_business_permission(business_id, 'team.remove')
);

-- Internal roles: staff only
create policy internal_roles_staff_only on public.internal_roles
for select to authenticated
using (public.is_kasitech_staff());

create policy internal_roles_super_admin_write on public.internal_roles
for all to authenticated
using (
  exists (
    select 1 from public.internal_roles ir
    where ir.user_id = auth.uid()
      and ir.role = 'KASITECH_SUPER_ADMIN'
  )
)
with check (
  exists (
    select 1 from public.internal_roles ir
    where ir.user_id = auth.uid()
      and ir.role = 'KASITECH_SUPER_ADMIN'
  )
);

-- Invitations
create policy invitations_select on public.invitations
for select to authenticated
using (
  public.is_kasitech_staff()
  or public.is_business_member(business_id)
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy invitations_insert on public.invitations
for insert to authenticated
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.invite')
);

create policy invitations_update on public.invitations
for update to authenticated
using (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.invite')
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'team.invite')
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- Audit logs
create policy audit_select on public.audit_logs
for select to authenticated
using (
  public.is_kasitech_staff()
  or (business_id is not null and public.is_business_member(business_id))
);

create policy audit_insert on public.audit_logs
for insert to authenticated
with check (
  actor_user_id = auth.uid()
  or public.is_kasitech_staff()
);

-- No update/delete policies for audit_logs → denied by default under RLS

-- ---------------------------------------------------------------------------
-- Seed permissions
-- ---------------------------------------------------------------------------
insert into public.permissions (key, description, category) values
  ('website.edit', 'Edit website content drafts', 'website'),
  ('website.publish', 'Publish website content', 'website'),
  ('catalog.edit', 'Manage catalog items', 'catalog'),
  ('bookings.view', 'View bookings', 'bookings'),
  ('bookings.manage', 'Manage bookings', 'bookings'),
  ('customers.view', 'View customers', 'customers'),
  ('customers.export', 'Export customer data', 'customers'),
  ('team.invite', 'Invite team members', 'team'),
  ('team.remove', 'Remove or deactivate team members', 'team'),
  ('team.manage_roles', 'Change team member roles', 'team'),
  ('billing.view', 'View billing information', 'billing'),
  ('billing.request_upgrade', 'Request plan upgrades or add-ons', 'billing'),
  ('analytics.view', 'View analytics', 'analytics'),
  ('settings.edit', 'Edit business settings', 'settings'),
  ('locations.manage', 'Manage locations', 'locations'),
  ('media.manage', 'Manage media library', 'media');

-- Seed system role templates (business_id null)
insert into public.roles (id, business_id, key, name, is_system) values
  ('11111111-1111-1111-1111-111111111001', null, 'BUSINESS_OWNER', 'Business Owner', true),
  ('11111111-1111-1111-1111-111111111002', null, 'BUSINESS_ADMIN', 'Business Admin', true),
  ('11111111-1111-1111-1111-111111111003', null, 'MANAGER', 'Manager', true),
  ('11111111-1111-1111-1111-111111111004', null, 'STAFF', 'Staff', true),
  ('11111111-1111-1111-1111-111111111005', null, 'VIEWER', 'Viewer', true);

-- Owner: all permissions
insert into public.role_permissions (role_id, permission_key)
select '11111111-1111-1111-1111-111111111001', key from public.permissions;

-- Admin: all except we still grant full set for Phase 1 parity with package defaults
insert into public.role_permissions (role_id, permission_key)
select '11111111-1111-1111-1111-111111111002', key from public.permissions;

insert into public.role_permissions (role_id, permission_key) values
  ('11111111-1111-1111-1111-111111111003', 'website.edit'),
  ('11111111-1111-1111-1111-111111111003', 'catalog.edit'),
  ('11111111-1111-1111-1111-111111111003', 'bookings.view'),
  ('11111111-1111-1111-1111-111111111003', 'bookings.manage'),
  ('11111111-1111-1111-1111-111111111003', 'customers.view'),
  ('11111111-1111-1111-1111-111111111003', 'team.invite'),
  ('11111111-1111-1111-1111-111111111003', 'analytics.view'),
  ('11111111-1111-1111-1111-111111111003', 'locations.manage'),
  ('11111111-1111-1111-1111-111111111003', 'media.manage'),
  ('11111111-1111-1111-1111-111111111004', 'catalog.edit'),
  ('11111111-1111-1111-1111-111111111004', 'bookings.view'),
  ('11111111-1111-1111-1111-111111111004', 'bookings.manage'),
  ('11111111-1111-1111-1111-111111111004', 'customers.view'),
  ('11111111-1111-1111-1111-111111111004', 'media.manage'),
  ('11111111-1111-1111-1111-111111111005', 'bookings.view'),
  ('11111111-1111-1111-1111-111111111005', 'customers.view'),
  ('11111111-1111-1111-1111-111111111005', 'analytics.view'),
  ('11111111-1111-1111-1111-111111111005', 'billing.view');
