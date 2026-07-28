-- KasiTech Business — Phase 9–10 growth, payments, hardening
-- Payments persistence, loyalty, campaigns, automation, suspension events, email outbox

-- ============================================================================
-- PAYMENTS
-- ============================================================================
create table public.payment_intents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  invoice_id uuid references public.invoices (id) on delete set null,
  provider text not null
    check (provider in ('manual', 'mpesa', 'card', 'bank_transfer')),
  amount_minor integer not null check (amount_minor >= 0),
  currency text not null default 'TZS',
  status text not null default 'CREATED'
    check (status in ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  provider_ref text,
  checkout_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payment_intents_business_idx
  on public.payment_intents (business_id, created_at desc);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete cascade,
  payment_intent_id uuid references public.payment_intents (id) on delete cascade,
  provider text not null,
  event_type text not null,
  provider_event_id text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

-- ============================================================================
-- LOYALTY
-- ============================================================================
create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  name text not null default 'Rewards',
  points_per_currency_unit numeric(12, 4) not null default 1,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACTIVE', 'PAUSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  phone text,
  email text,
  points_balance integer not null default 0,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loyalty_members_business_idx
  on public.loyalty_members (business_id, created_at desc);

create table public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  member_id uuid not null references public.loyalty_members (id) on delete cascade,
  delta_points integer not null,
  reason text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CAMPAIGNS
-- ============================================================================
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  channel text not null
    check (channel in ('WHATSAPP', 'SMS', 'EMAIL')),
  subject text,
  body text not null,
  audience_filter jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index campaigns_business_idx on public.campaigns (business_id, created_at desc);

-- ============================================================================
-- AUTOMATION
-- ============================================================================
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  trigger_key text not null,
  action_key text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'ACTIVE', 'PAUSED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  rule_id uuid not null references public.automation_rules (id) on delete cascade,
  status text not null default 'SUCCEEDED'
    check (status in ('SUCCEEDED', 'FAILED', 'SKIPPED')),
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- SUSPENSION / BILLING POLICY EVENTS
-- ============================================================================
create table public.billing_policy_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text not null,
  actor_user_id uuid references public.profiles (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index billing_policy_events_business_idx
  on public.billing_policy_events (business_id, created_at desc);

-- ============================================================================
-- EMAIL OUTBOX
-- ============================================================================
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses (id) on delete set null,
  to_email text not null,
  subject text not null,
  body_text text not null,
  template_key text,
  status text not null default 'QUEUED'
    check (status in ('QUEUED', 'SENT', 'FAILED', 'SKIPPED_PREVIEW')),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ============================================================================
-- RATE LIMIT BUCKETS (optional DB-backed)
-- ============================================================================
create table public.rate_limit_buckets (
  bucket_key text primary key,
  hit_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated-at triggers
do $$
declare
  t text;
begin
  foreach t in array array[
    'payment_intents', 'loyalty_programs', 'loyalty_members',
    'campaigns', 'automation_rules'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- RLS
do $$
declare
  t text;
begin
  foreach t in array array[
    'payment_intents', 'payment_events',
    'loyalty_programs', 'loyalty_members', 'loyalty_ledger',
    'campaigns', 'automation_rules', 'automation_runs',
    'billing_policy_events', 'email_outbox'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

alter table public.rate_limit_buckets enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'payment_intents', 'loyalty_programs', 'loyalty_members', 'loyalty_ledger',
    'campaigns', 'automation_rules', 'automation_runs', 'billing_policy_events'
  ]
  loop
    execute format(
      'create policy %I_select on public.%I for select to authenticated
       using (public.policy_business_select(business_id))',
      t, t
    );
    execute format(
      'create policy %I_write on public.%I for all to authenticated
       using (public.is_kasitech_staff() or public.is_business_member(business_id))
       with check (public.is_kasitech_staff() or public.is_business_member(business_id))',
      t, t
    );
  end loop;
end $$;

create policy payment_events_staff on public.payment_events
for all to authenticated
using (public.is_kasitech_staff() or public.policy_business_select(business_id))
with check (public.is_kasitech_staff());

create policy email_outbox_staff on public.email_outbox
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());

create policy rate_limit_buckets_staff on public.rate_limit_buckets
for all to authenticated
using (public.is_kasitech_staff())
with check (public.is_kasitech_staff());
