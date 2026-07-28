-- KasiTech Business — Phase 2 commercial core
-- Plans, features, entitlements, subscriptions, add-ons, overrides, upgrade requests

-- ---------------------------------------------------------------------------
-- Plans (configurable — not hard-coded in UI logic)
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  monthly_price_minor integer,
  currency text not null default 'TZS',
  billing_interval text not null default 'MONTHLY'
    check (billing_interval in ('MONTHLY', 'YEARLY', 'CUSTOM')),
  is_public boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Features (entitlement catalog)
-- ---------------------------------------------------------------------------
create table public.features (
  key text primary key,
  name text not null,
  description text,
  value_type text not null default 'boolean'
    check (value_type in ('boolean', 'limit', 'enum')),
  category text not null default 'core',
  created_at timestamptz not null default now()
);

create table public.plan_entitlements (
  plan_id uuid not null references public.plans (id) on delete cascade,
  feature_key text not null references public.features (key) on delete cascade,
  -- For boolean: 'true'/'false'; for limit: integer as text; for enum: value
  value text not null,
  primary key (plan_id, feature_key)
);

-- ---------------------------------------------------------------------------
-- Add-ons
-- ---------------------------------------------------------------------------
create table public.addons (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  monthly_price_minor integer not null,
  currency text not null default 'TZS',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger addons_set_updated_at
before update on public.addons
for each row execute function public.set_updated_at();

create table public.addon_entitlements (
  addon_id uuid not null references public.addons (id) on delete cascade,
  feature_key text not null references public.features (key) on delete cascade,
  value text not null,
  -- How this add-on combines with base plan for limit features
  merge_strategy text not null default 'add'
    check (merge_strategy in ('add', 'max', 'replace', 'enable')),
  primary key (addon_id, feature_key)
);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  plan_id uuid not null references public.plans (id),
  status text not null default 'ONBOARDING'
    check (status in (
      'ONBOARDING', 'ACTIVE', 'PAST_DUE', 'GRACE_PERIOD',
      'RESTRICTED', 'SUSPENDED', 'TERMINATED'
    )),
  billing_frequency text not null default 'MONTHLY'
    check (billing_frequency in ('MONTHLY', 'YEARLY', 'CUSTOM')),
  monthly_price_minor integer,
  currency text not null default 'TZS',
  billing_start_date date,
  contract_start_date date,
  contract_end_date date,
  payment_status text not null default 'PENDING'
    check (payment_status in ('PENDING', 'PAID', 'FAILED', 'OVERDUE', 'REFUNDED', 'VOID')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_business_idx
  on public.subscriptions (business_id, status);

create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create table public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions (id) on delete cascade,
  item_type text not null check (item_type in ('PLAN', 'ADDON', 'OVERRIDE')),
  addon_id uuid references public.addons (id),
  description text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_minor integer not null default 0,
  currency text not null default 'TZS',
  created_at timestamptz not null default now()
);

create index subscription_items_subscription_idx
  on public.subscription_items (subscription_id);

-- ---------------------------------------------------------------------------
-- Business add-ons & entitlement overrides
-- ---------------------------------------------------------------------------
create table public.business_addons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  addon_id uuid not null references public.addons (id),
  quantity integer not null default 1 check (quantity > 0),
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'CANCELLED', 'PENDING')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index business_addons_business_idx
  on public.business_addons (business_id, status);

create trigger business_addons_set_updated_at
before update on public.business_addons
for each row execute function public.set_updated_at();

create table public.business_entitlement_overrides (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  feature_key text not null references public.features (key),
  value text not null,
  reason text not null,
  created_by uuid references public.profiles (id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (business_id, feature_key)
);

-- ---------------------------------------------------------------------------
-- Upgrade requests (no silent charge/upgrade)
-- ---------------------------------------------------------------------------
create table public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  request_type text not null
    check (request_type in ('UPGRADE_PLAN', 'ADDON', 'LIMIT_INCREASE')),
  target_plan_id uuid references public.plans (id),
  target_addon_id uuid references public.addons (id),
  feature_key text references public.features (key),
  message text,
  status text not null default 'REQUESTED'
    check (status in (
      'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'CANCELLED', 'COMPLETED'
    )),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index upgrade_requests_business_idx
  on public.upgrade_requests (business_id, status);

create trigger upgrade_requests_set_updated_at
before update on public.upgrade_requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Locations (needed for location limit enforcement)
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  address text,
  phone text,
  email text,
  timezone text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_business_idx on public.locations (business_id, status);

create trigger locations_set_updated_at
before update on public.locations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.features enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.addons enable row level security;
alter table public.addon_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_items enable row level security;
alter table public.business_addons enable row level security;
alter table public.business_entitlement_overrides enable row level security;
alter table public.upgrade_requests enable row level security;
alter table public.locations enable row level security;

-- Catalogs readable by authenticated users
create policy plans_select on public.plans
for select to authenticated using (true);

create policy plans_write_staff on public.plans
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy features_select on public.features
for select to authenticated using (true);

create policy features_write_staff on public.features
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy plan_entitlements_select on public.plan_entitlements
for select to authenticated using (true);

create policy plan_entitlements_write_staff on public.plan_entitlements
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy addons_select on public.addons
for select to authenticated using (true);

create policy addons_write_staff on public.addons
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy addon_entitlements_select on public.addon_entitlements
for select to authenticated using (true);

create policy addon_entitlements_write_staff on public.addon_entitlements
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

-- Tenant commercial tables
create policy subscriptions_select on public.subscriptions
for select to authenticated
using (
  public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy subscriptions_write_staff on public.subscriptions
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy subscription_items_select on public.subscription_items
for select to authenticated
using (
  exists (
    select 1 from public.subscriptions s
    where s.id = subscription_id
      and (public.is_business_member(s.business_id) or public.is_kasitech_staff())
  )
);

create policy subscription_items_write_staff on public.subscription_items
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy business_addons_select on public.business_addons
for select to authenticated
using (
  public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy business_addons_write_staff on public.business_addons
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy overrides_select on public.business_entitlement_overrides
for select to authenticated
using (
  public.is_kasitech_staff()
  or (
    public.is_business_member(business_id)
    and public.has_business_permission(business_id, 'billing.view')
  )
);

create policy overrides_write_staff on public.business_entitlement_overrides
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy upgrade_requests_select on public.upgrade_requests
for select to authenticated
using (
  public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy upgrade_requests_insert on public.upgrade_requests
for insert to authenticated
with check (
  public.is_kasitech_staff()
  or (
    public.has_business_permission(business_id, 'billing.request_upgrade')
    and requested_by = auth.uid()
  )
);

create policy upgrade_requests_update_staff on public.upgrade_requests
for update to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy locations_select on public.locations
for select to authenticated
using (
  public.is_business_member(business_id)
  or public.is_kasitech_staff()
);

create policy locations_write on public.locations
for all to authenticated
using (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'locations.manage')
)
with check (
  public.is_kasitech_staff()
  or public.has_business_permission(business_id, 'locations.manage')
);

-- ---------------------------------------------------------------------------
-- Seed features
-- ---------------------------------------------------------------------------
insert into public.features (key, name, description, value_type, category) values
  ('max_users', 'Maximum users', 'Active membership seat limit', 'limit', 'limits'),
  ('max_locations', 'Maximum locations', 'Active location limit', 'limit', 'limits'),
  ('max_qr_codes', 'Maximum QR codes', 'QR code limit', 'limit', 'limits'),
  ('website_enabled', 'Website', 'Website CMS access', 'boolean', 'core'),
  ('cms_enabled', 'CMS', 'Content management', 'boolean', 'core'),
  ('catalog_enabled', 'Catalog', 'Products/services/menu', 'boolean', 'core'),
  ('basic_analytics_enabled', 'Basic analytics', 'Basic analytics widgets', 'boolean', 'analytics'),
  ('advanced_analytics_enabled', 'Advanced analytics', 'Advanced insights', 'boolean', 'analytics'),
  ('bookings_enabled', 'Bookings', 'Bookings/appointments/reservations', 'boolean', 'operations'),
  ('events_enabled', 'Events', 'Events module', 'boolean', 'operations'),
  ('customers_enabled', 'Customers', 'CRM / customer system', 'boolean', 'growth'),
  ('qr_enabled', 'QR', 'General QR capability', 'boolean', 'operations'),
  ('table_service_enabled', 'Table service', 'Table QR / service requests', 'boolean', 'operations'),
  ('multi_location_enabled', 'Multi-location', 'Multi-location operations', 'boolean', 'operations'),
  ('advanced_permissions_enabled', 'Advanced permissions', 'Advanced role controls', 'boolean', 'management'),
  ('loyalty_enabled', 'Loyalty', 'KasiRewards / loyalty', 'boolean', 'growth'),
  ('campaigns_enabled', 'Campaigns', 'Campaign tools', 'boolean', 'growth'),
  ('automation_enabled', 'Automation', 'KasiAutomate', 'boolean', 'growth'),
  ('scheduled_publish_enabled', 'Scheduled publishing', 'Schedule CMS publishes', 'boolean', 'website'),
  ('priority_support_enabled', 'Priority support', 'Priority care SLA', 'boolean', 'support');

-- ---------------------------------------------------------------------------
-- Seed plans (TZS amounts as integer minor units = whole shillings)
-- ---------------------------------------------------------------------------
insert into public.plans (id, key, name, description, monthly_price_minor, currency, sort_order) values
  ('22222222-2222-2222-2222-222222222001', 'LAUNCH', 'Launch', 'Solo / independent professional web presence', 150000, 'TZS', 10),
  ('22222222-2222-2222-2222-222222222002', 'GROWTH', 'Growth', 'Bookings, customers, team access', 400000, 'TZS', 20),
  ('22222222-2222-2222-2222-222222222003', 'PRO', 'Pro', 'Advanced operations and multi-location', 800000, 'TZS', 30),
  ('22222222-2222-2222-2222-222222222004', 'SCALE', 'Scale', 'Loyalty, automation, advanced growth', 1500000, 'TZS', 40),
  ('22222222-2222-2222-2222-222222222005', 'ENTERPRISE', 'Enterprise', 'Custom commercial terms', null, 'TZS', 50);

-- Launch entitlements
insert into public.plan_entitlements (plan_id, feature_key, value) values
  ('22222222-2222-2222-2222-222222222001', 'max_users', '1'),
  ('22222222-2222-2222-2222-222222222001', 'max_locations', '1'),
  ('22222222-2222-2222-2222-222222222001', 'max_qr_codes', '0'),
  ('22222222-2222-2222-2222-222222222001', 'website_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222001', 'cms_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222001', 'catalog_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222001', 'basic_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222001', 'bookings_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222001', 'events_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222001', 'customers_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222001', 'qr_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222001', 'loyalty_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222001', 'automation_enabled', 'false');

-- Growth
insert into public.plan_entitlements (plan_id, feature_key, value) values
  ('22222222-2222-2222-2222-222222222002', 'max_users', '5'),
  ('22222222-2222-2222-2222-222222222002', 'max_locations', '1'),
  ('22222222-2222-2222-2222-222222222002', 'max_qr_codes', '10'),
  ('22222222-2222-2222-2222-222222222002', 'website_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'cms_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'catalog_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'basic_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'bookings_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'events_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'customers_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'qr_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222002', 'loyalty_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222002', 'automation_enabled', 'false');

-- Pro
insert into public.plan_entitlements (plan_id, feature_key, value) values
  ('22222222-2222-2222-2222-222222222003', 'max_users', '10'),
  ('22222222-2222-2222-2222-222222222003', 'max_locations', '2'),
  ('22222222-2222-2222-2222-222222222003', 'max_qr_codes', '50'),
  ('22222222-2222-2222-2222-222222222003', 'website_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'cms_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'catalog_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'basic_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'advanced_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'bookings_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'events_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'customers_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'qr_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'table_service_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'multi_location_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'advanced_permissions_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'scheduled_publish_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222003', 'loyalty_enabled', 'false'),
  ('22222222-2222-2222-2222-222222222003', 'automation_enabled', 'false');

-- Scale
insert into public.plan_entitlements (plan_id, feature_key, value) values
  ('22222222-2222-2222-2222-222222222004', 'max_users', '25'),
  ('22222222-2222-2222-2222-222222222004', 'max_locations', '5'),
  ('22222222-2222-2222-2222-222222222004', 'max_qr_codes', '200'),
  ('22222222-2222-2222-2222-222222222004', 'website_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'cms_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'catalog_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'basic_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'advanced_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'bookings_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'events_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'customers_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'qr_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'table_service_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'multi_location_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'advanced_permissions_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'scheduled_publish_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'loyalty_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'campaigns_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'automation_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222004', 'priority_support_enabled', 'true');

-- Enterprise defaults (custom overrides expected)
insert into public.plan_entitlements (plan_id, feature_key, value) values
  ('22222222-2222-2222-2222-222222222005', 'max_users', '100'),
  ('22222222-2222-2222-2222-222222222005', 'max_locations', '25'),
  ('22222222-2222-2222-2222-222222222005', 'max_qr_codes', '1000'),
  ('22222222-2222-2222-2222-222222222005', 'website_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'cms_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'catalog_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'basic_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'advanced_analytics_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'bookings_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'events_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'customers_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'qr_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'table_service_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'multi_location_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'advanced_permissions_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'scheduled_publish_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'loyalty_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'campaigns_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'automation_enabled', 'true'),
  ('22222222-2222-2222-2222-222222222005', 'priority_support_enabled', 'true');

-- ---------------------------------------------------------------------------
-- Seed add-ons
-- ---------------------------------------------------------------------------
insert into public.addons (id, key, name, description, monthly_price_minor, currency) values
  ('33333333-3333-3333-3333-333333333001', 'TEAM_PACK', 'Team Pack', 'Additional user seats', 75000, 'TZS'),
  ('33333333-3333-3333-3333-333333333002', 'ADDITIONAL_LOCATION', 'Additional Location', 'Extra location capacity', 100000, 'TZS'),
  ('33333333-3333-3333-3333-333333333003', 'QR_PACK', 'QR Pack', 'Additional QR codes', 50000, 'TZS'),
  ('33333333-3333-3333-3333-333333333004', 'KASI_REWARDS', 'KasiRewards', 'Loyalty program', 150000, 'TZS'),
  ('33333333-3333-3333-3333-333333333005', 'KASI_AUTOMATE', 'KasiAutomate', 'Automation workflows', 200000, 'TZS'),
  ('33333333-3333-3333-3333-333333333006', 'KASI_CONNECT', 'KasiConnect', 'Advanced integrations', 150000, 'TZS'),
  ('33333333-3333-3333-3333-333333333007', 'KASI_INSIGHTS', 'KasiInsights', 'Advanced analytics pack', 120000, 'TZS'),
  ('33333333-3333-3333-3333-333333333008', 'PRIORITY_CARE', 'Priority Care', 'Priority support SLA', 100000, 'TZS');

insert into public.addon_entitlements (addon_id, feature_key, value, merge_strategy) values
  ('33333333-3333-3333-3333-333333333001', 'max_users', '5', 'add'),
  ('33333333-3333-3333-3333-333333333002', 'max_locations', '1', 'add'),
  ('33333333-3333-3333-3333-333333333002', 'multi_location_enabled', 'true', 'enable'),
  ('33333333-3333-3333-3333-333333333003', 'max_qr_codes', '25', 'add'),
  ('33333333-3333-3333-3333-333333333003', 'qr_enabled', 'true', 'enable'),
  ('33333333-3333-3333-3333-333333333004', 'loyalty_enabled', 'true', 'enable'),
  ('33333333-3333-3333-3333-333333333005', 'automation_enabled', 'true', 'enable'),
  ('33333333-3333-3333-3333-333333333007', 'advanced_analytics_enabled', 'true', 'enable'),
  ('33333333-3333-3333-3333-333333333008', 'priority_support_enabled', 'true', 'enable');
