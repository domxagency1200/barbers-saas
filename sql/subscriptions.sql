-- Run this in your Supabase SQL editor

-- ── subscription_plans ───────────────────────────────────────
create table if not exists subscription_plans (
  id             uuid primary key default gen_random_uuid(),
  salon_id       uuid references salons(id) on delete cascade,
  name           text    not null,
  price          numeric not null default 0,
  duration_months int    not null default 1,  -- 1 = monthly, 12 = yearly
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

alter table subscription_plans enable row level security;

create policy "salon members can manage subscription_plans"
  on subscription_plans for all
  using (
    salon_id in (
      select salon_id from salon_members where user_id = auth.uid()
    )
  );

-- ── subscribers ──────────────────────────────────────────────
create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  salon_id   uuid references salons(id) on delete cascade,
  plan_id    uuid references subscription_plans(id) on delete set null,
  name       text not null,
  phone      text not null,
  start_date date not null,
  end_date   date not null,
  created_at timestamptz not null default now()
);

alter table subscribers enable row level security;

create policy "salon members can manage subscribers"
  on subscribers for all
  using (
    salon_id in (
      select salon_id from salon_members where user_id = auth.uid()
    )
  );
