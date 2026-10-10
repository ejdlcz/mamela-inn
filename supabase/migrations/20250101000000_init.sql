-- Mamela's Inn — database schema
--
-- HOW TO APPLY (pick one):
--   A) Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run
--   B) Supabase CLI:  supabase link --project-ref <ref>  &&  supabase db push
--
-- Safe to run more than once. To change the schema later, DON'T edit this file:
-- add a new file here, e.g. 20250301000000_add_notes_column.sql, and apply it.

-- ROOMS ----------------------------------------------------------------------
create table if not exists public.rooms (
  id         text primary key,
  number     text not null,
  rate       numeric not null default 180,
  status     text not null default 'vacant' check (status in ('vacant', 'occupied')),
  txn_id     text,
  guest_name text,
  time_out   timestamptz
);

-- TRANSACTIONS ---------------------------------------------------------------
create table if not exists public.transactions (
  ref             text primary key,
  guest_name      text not null,
  room_ids        text[] not null,
  hours           numeric not null,
  time_in         timestamptz not null,
  time_out        timestamptz not null,
  actual_time_out timestamptz,
  payment_method  text not null
                  check (payment_method in ('Cash', 'GCash', 'Maya', 'Credit Card', 'Bank Transfer')),
  total_amount    numeric not null default 0,
  status          text not null default 'active'
                  check (status in ('active', 'scheduled', 'completed', 'cancelled')),
  created_at      timestamptz not null default now()
);

create index if not exists transactions_created_at_idx on public.transactions (created_at desc);
create index if not exists transactions_time_in_idx    on public.transactions (time_in desc);
create index if not exists transactions_status_idx     on public.transactions (status);

-- SETTINGS (a single row, id is always 1) ------------------------------------
create table if not exists public.settings (
  id               int primary key default 1,
  inn_name         text not null default 'Mamela''s Inn',
  tagline          text default 'At Home Tayo',
  owner_email      text default 'owner@mamelasinn.example',
  recipient_emails text[] not null default '{}',
  tax_rate         numeric not null default 0,
  default_rate     numeric not null default 180,
  constraint settings_singleton check (id = 1)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Starter rooms 101-110 (does nothing if they already exist)
insert into public.rooms (id, number, rate, status)
select n::text, n::text, 180, 'vacant'
from generate_series(101, 110) as n
on conflict (id) do nothing;

-- REALTIME (live updates between devices) ------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.rooms;        exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.transactions; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings;     exception when duplicate_object then null; end;
end $$;

-- ROW LEVEL SECURITY ---------------------------------------------------------
-- STARTER POLICIES: anyone holding the project's public "anon" key can read and
-- write. That is fine for getting started, but the key ships inside the website,
-- so anyone who inspects the site could call the API directly. Before storing
-- real guest data, move to Supabase Auth and tighten these policies
-- (see README -> "Security notes").
alter table public.rooms        enable row level security;
alter table public.transactions enable row level security;
alter table public.settings     enable row level security;

drop policy if exists "rooms_all_anon"        on public.rooms;
drop policy if exists "transactions_all_anon" on public.transactions;
drop policy if exists "settings_all_anon"     on public.settings;

create policy "rooms_all_anon"        on public.rooms        for all using (true) with check (true);
create policy "transactions_all_anon" on public.transactions for all using (true) with check (true);
create policy "settings_all_anon"     on public.settings     for all using (true) with check (true);
