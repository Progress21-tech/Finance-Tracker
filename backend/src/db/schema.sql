-- ============================================================
-- Finance Tracker — Supabase / Postgres Schema
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── users ────────────────────────────────────────────────────
create table if not exists public.users (
  id               uuid primary key default gen_random_uuid(),
  whatsapp_number  text unique not null,        -- E.164 e.g. +2348012345678
  display_name     text,
  daily_threshold  numeric not null default 10000,
  currency         text not null default 'NGN',
  created_at       timestamptz not null default now()
);

alter table public.users enable row level security;

-- Service-role key bypasses RLS automatically.
-- Authenticated users can only see/edit their own row.
create policy "users: own row" on public.users
  for all using (auth.uid() = id);

-- ── transactions ─────────────────────────────────────────────
create table if not exists public.transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  direction     text not null check (direction in ('in', 'out')),
  bucket        text not null check (bucket in ('expense', 'income', 'saving', 'investment')),
  amount        numeric not null check (amount >= 0),
  currency      text not null default 'NGN',
  category      text not null default '',
  source        text not null default '',
  remark        text not null default '',
  channel       text not null check (channel in (
                  'whatsapp_text', 'whatsapp_voice', 'alert', 'statement', 'manual'
                )),
  occurred_at   timestamptz not null default now(),
  raw_input     text,
  confidence    numeric not null default 1 check (confidence between 0 and 1),
  needs_review  boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists transactions_user_id_idx       on public.transactions(user_id);
create index if not exists transactions_occurred_at_idx   on public.transactions(occurred_at);
create index if not exists transactions_bucket_idx        on public.transactions(bucket);

alter table public.transactions enable row level security;

create policy "transactions: own rows" on public.transactions
  for all using (auth.uid() = user_id);

-- ── statements ───────────────────────────────────────────────
create table if not exists public.statements (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  file_url      text not null,
  period_start  date,
  period_end    date,
  status        text not null default 'processing' check (status in ('processing', 'done', 'error')),
  error_msg     text,
  tx_count      integer default 0,
  created_at    timestamptz not null default now()
);

alter table public.statements enable row level security;

create policy "statements: own rows" on public.statements
  for all using (auth.uid() = user_id);

-- ── Supabase Storage bucket ───────────────────────────────────
-- Create a private bucket called "statements" in the Supabase dashboard,
-- or run the storage API. Only the service role can read/write.
-- insert into storage.buckets (id, name, public) values ('statements', 'statements', false);

-- ── Seed: test user ───────────────────────────────────────────
-- Replace +2348012345678 with your real WhatsApp number before running.
-- insert into public.users (whatsapp_number, display_name, daily_threshold)
-- values ('+2348012345678', 'Me', 10000)
-- on conflict (whatsapp_number) do nothing;
