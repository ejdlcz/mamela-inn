-- Adds: guest counts, cancellation/refund details, overstay tracking, grace period.
--
-- RUN THIS BEFORE you deploy the matching app update, otherwise saving a booking will
-- fail ("column ... does not exist").
--   Supabase Dashboard -> SQL Editor -> New query -> paste this file -> Run
-- Safe to run more than once.

alter table public.transactions
  add column if not exists adults            int     not null default 1,
  add column if not exists children          int     not null default 0,
  add column if not exists cancel_reason     text,
  add column if not exists cancel_note       text,
  add column if not exists refund_amount     numeric,
  add column if not exists cancelled_at      timestamptz,
  add column if not exists overstay_minutes  int,
  add column if not exists auto_checked_out  boolean not null default false;

-- A room that was freed automatically after an overstay keeps this reference until the
-- clerk confirms the guest left.
alter table public.rooms
  add column if not exists overstay_ref text;

-- Minutes after the time-out before an overdue guest is removed automatically.
alter table public.settings
  add column if not exists grace_minutes int not null default 15;
