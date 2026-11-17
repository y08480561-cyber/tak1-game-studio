-- TAK1 Game Studio (kalametgame.ir) — Supabase PostgreSQL Schema
-- Run this SQL in your Supabase project's SQL Editor to enable full Supabase persistence.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null check (category in ('game', 'app', 'tool')),
  title_fa text not null,
  title_en text not null,
  short_desc_fa text not null default '',
  short_desc_en text not null default '',
  full_desc_fa text not null default '',
  full_desc_en text not null default '',
  version text not null default '1.0.0',
  release_date text not null default '',
  icon_url text not null default '',
  screenshots jsonb not null default '[]'::jsonb,
  links jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title_fa text not null,
  title_en text not null,
  summary_fa text not null default '',
  summary_en text not null default '',
  content_fa text not null default '',
  content_en text not null default '',
  cover_url text not null default '',
  category text not null default 'studio',
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name_fa text not null,
  name_en text not null,
  role_fa text not null,
  role_en text not null,
  bio_fa text not null default '',
  bio_en text not null default '',
  avatar_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  name text not null,
  email text not null,
  product_name text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_reply text not null default '',
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  category text not null default 'feature',
  title text not null,
  details text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'archived')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.products enable row level security;
alter table public.news enable row level security;
alter table public.team_members enable row level security;
alter table public.support_tickets enable row level security;
alter table public.suggestions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.admin_users enable row level security;

-- Public Read Policies for published catalog, news, and team
create policy "Public read published products" on public.products for select using (published = true);
create policy "Public read news" on public.news for select using (true);
create policy "Public read team" on public.team_members for select using (true);

-- Public Insert Policies for Support, Suggestions, Contact
create policy "Public submit support ticket" on public.support_tickets for insert with check (true);
create policy "Public submit suggestion" on public.suggestions for insert with check (true);
create policy "Public submit contact" on public.contact_messages for insert with check (true);
