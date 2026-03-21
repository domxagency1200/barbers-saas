-- Run this in your Supabase SQL editor

-- ── salons: add whatsapp_number ──────────────────────────────
alter table salons add column if not exists whatsapp_number text;

-- ── working_hours (one row per salon) ────────────────────────
create table if not exists working_hours (
  id       uuid primary key default gen_random_uuid(),
  salon_id uuid unique references salons(id) on delete cascade,
  open_at  time not null default '09:00',
  close_at time not null default '21:00'
);

alter table working_hours enable row level security;

create policy "salon members can manage working_hours"
  on working_hours for all
  using (
    salon_id in (
      select salon_id from salon_members where user_id = auth.uid()
    )
  );

-- ── barbers: add is_available ────────────────────────────────
alter table barbers add column if not exists is_available boolean not null default true;
