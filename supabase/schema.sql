-- TAK1 Game Studio (kalametgame.ir) — Complete Supabase PostgreSQL Schema & Security Policies
-- Run this SQL manually in your Supabase project's SQL Editor.
-- Safe & Idempotent: Can be executed on a fresh project or an existing TAK1 schema without creating duplicates.

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. Automatic updated_at Trigger Function
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 2. Admin Users & Access Control Roles (linked to Supabase Auth auth.users)
-- ============================================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text not null default '',
  role text not null default 'admin' check (role in ('super_admin', 'admin', 'editor')),
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade legacy admin_users columns safely if upgrading from an older schema
alter table public.admin_users add column if not exists auth_user_id uuid unique references auth.users(id) on delete cascade;
alter table public.admin_users add column if not exists display_name text not null default '';
alter table public.admin_users add column if not exists role text not null default 'admin';
alter table public.admin_users add column if not exists is_active boolean not null default true;
alter table public.admin_users add column if not exists last_login_at timestamptz;
alter table public.admin_users add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'admin_users' and column_name = 'password_hash'
  ) then
    execute 'alter table public.admin_users alter column password_hash drop not null';
  end if;
end $$;

-- ============================================================================
-- 3. Published Products (Games, Apps, Software Tools)
-- ============================================================================
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
  created_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists created_by uuid references public.admin_users(id) on delete set null;
create index if not exists idx_products_published_created on public.products (published, created_at desc);
create index if not exists idx_products_category on public.products (category);

-- ============================================================================
-- 4. Studio News & Announcements (supports Published & Draft states)
-- ============================================================================
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title_fa text not null,
  title_en text not null,
  summary_fa text not null default '',
  summary_en text not null default '',
  content_fa text not null default '',
  content_en text not null default '',
  cover_url text not null default '',
  category text not null default 'studio' check (category in ('release', 'studio', 'update', 'event')),
  published boolean not null default true,
  published_at timestamptz not null default now(),
  author_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news add column if not exists published boolean not null default true;
alter table public.news add column if not exists author_id uuid references public.admin_users(id) on delete set null;
alter table public.news add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_news_published_date on public.news (published, published_at desc);

-- ============================================================================
-- 5. Development Team Members (supports Published & Draft states)
-- ============================================================================
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
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members add column if not exists published boolean not null default true;
alter table public.team_members add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_team_published_order on public.team_members (published, sort_order asc);

-- ============================================================================
-- 6. Support Tickets (linked optionally to products & responding admin)
-- ============================================================================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  name text not null,
  email text not null,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null default '',
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  admin_reply text not null default '',
  replied_by uuid references public.admin_users(id) on delete set null,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.support_tickets add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.support_tickets add column if not exists replied_by uuid references public.admin_users(id) on delete set null;
alter table public.support_tickets add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_support_tickets_status_created on public.support_tickets (status, created_at desc);

-- ============================================================================
-- 7. User Suggestions & Feedback
-- ============================================================================
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null default '',
  category text not null default 'feature' check (category in ('feature', 'game_idea', 'improvement', 'other')),
  product_id uuid references public.products(id) on delete set null,
  title text not null,
  details text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'planned', 'archived')),
  admin_note text not null default '',
  reviewed_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suggestions add column if not exists product_id uuid references public.products(id) on delete set null;
alter table public.suggestions add column if not exists reviewed_by uuid references public.admin_users(id) on delete set null;
alter table public.suggestions add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_suggestions_status_created on public.suggestions (status, created_at desc);

-- ============================================================================
-- 8. Direct Contact Messages
-- ============================================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_messages add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_contact_messages_read_created on public.contact_messages (read, created_at desc);

-- ============================================================================
-- 9. General Site Settings (Singleton Row 'default')
-- ============================================================================
create table if not exists public.site_settings (
  id text primary key default 'default' check (id = 'default'),
  studio_name_fa text not null default 'استودیوی بازی‌سازی TAK1',
  studio_name_en text not null default 'TAK1 Game Studio',
  tagline_fa text not null default 'توسعه مستقل بازی‌های ویدئویی و نرم‌افزارهای تخصصی با استانداردهای مهندسی مدرن.',
  tagline_en text not null default 'Independent game development and precision software studio built for modern platforms.',
  contact_email text not null default 'contact@kalametgame.ir',
  official_domain text not null default 'kalametgame.ir',
  maintenance_mode boolean not null default false,
  announcement_fa text not null default '',
  announcement_en text not null default '',
  social_links jsonb not null default '{}'::jsonb,
  updated_by uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id)
values ('default')
on conflict (id) do nothing;

-- ============================================================================
-- 10. updated_at Triggers (Idempotent)
-- ============================================================================
drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at before update on public.admin_users for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();

drop trigger if exists trg_news_updated_at on public.news;
create trigger trg_news_updated_at before update on public.news for each row execute function public.set_updated_at();

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();

drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at before update on public.support_tickets for each row execute function public.set_updated_at();

drop trigger if exists trg_suggestions_updated_at on public.suggestions;
create trigger trg_suggestions_updated_at before update on public.suggestions for each row execute function public.set_updated_at();

drop trigger if exists trg_contact_messages_updated_at on public.contact_messages;
create trigger trg_contact_messages_updated_at before update on public.contact_messages for each row execute function public.set_updated_at();

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

-- ============================================================================
-- 11. Security Helper Functions for RLS
-- ============================================================================
create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.is_active = true
      and (
        a.auth_user_id = auth.uid()
        or lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

create or replace function public.is_super_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.is_active = true
      and a.role in ('super_admin', 'admin')
      and (
        a.auth_user_id = auth.uid()
        or lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

-- ============================================================================
-- 12. Enable Row Level Security (RLS) on All Tables
-- ============================================================================
alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.news enable row level security;
alter table public.team_members enable row level security;
alter table public.support_tickets enable row level security;
alter table public.suggestions enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;

-- ============================================================================
-- 13. RLS Policies (Idempotent: Drop & Recreate cleanly)
-- ============================================================================

-- Products
drop policy if exists "Public read published products" on public.products;
create policy "Public read published products"
  on public.products for select
  using (published = true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- News
drop policy if exists "Public read news" on public.news;
drop policy if exists "Public read published news" on public.news;
create policy "Public read published news"
  on public.news for select
  using (published = true);

drop policy if exists "Admins manage news" on public.news;
create policy "Admins manage news"
  on public.news for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Team Members
drop policy if exists "Public read team" on public.team_members;
drop policy if exists "Public read published team" on public.team_members;
create policy "Public read published team"
  on public.team_members for select
  using (published = true);

drop policy if exists "Admins manage team" on public.team_members;
create policy "Admins manage team"
  on public.team_members for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Site Settings (Public Read, Admin/SuperAdmin Write)
drop policy if exists "Public read site settings" on public.site_settings;
create policy "Public read site settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
  on public.site_settings for all
  to authenticated
  using (public.is_super_or_admin())
  with check (public.is_super_or_admin());

-- Support Tickets (Insert-only for public, NO public SELECT; Full access for Admins)
drop policy if exists "Public submit support ticket" on public.support_tickets;
create policy "Public submit support ticket"
  on public.support_tickets for insert
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 0
    and length(trim(subject)) > 0
    and length(trim(message)) > 0
  );

drop policy if exists "Admins manage support tickets" on public.support_tickets;
create policy "Admins manage support tickets"
  on public.support_tickets for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Suggestions (Insert-only for public, NO public SELECT; Full access for Admins)
drop policy if exists "Public submit suggestion" on public.suggestions;
create policy "Public submit suggestion"
  on public.suggestions for insert
  with check (
    length(trim(name)) > 0
    and length(trim(title)) > 0
    and length(trim(details)) > 0
  );

drop policy if exists "Admins manage suggestions" on public.suggestions;
create policy "Admins manage suggestions"
  on public.suggestions for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Contact Messages (Insert-only for public, NO public SELECT; Full access for Admins)
drop policy if exists "Public submit contact" on public.contact_messages;
create policy "Public submit contact"
  on public.contact_messages for insert
  with check (
    length(trim(name)) > 0
    and length(trim(email)) > 0
    and length(trim(subject)) > 0
    and length(trim(message)) > 0
  );

drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages"
  on public.contact_messages for all
  to authenticated
  using (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Admin Users (Zero public access; Admins read, Super Admins / Admins manage)
drop policy if exists "Admins read admin_users" on public.admin_users;
create policy "Admins read admin_users"
  on public.admin_users for select
  to authenticated
  using (public.is_studio_admin());

drop policy if exists "Super admins manage admin_users" on public.admin_users;
create policy "Super admins manage admin_users"
  on public.admin_users for all
  to authenticated
  using (public.is_super_or_admin())
  with check (public.is_super_or_admin());

-- ============================================================================
-- 14. Supabase Storage Bucket for Studio Media (Icons, Screenshots, Covers, Avatars)
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studio-media',
  'studio-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "Public read studio-media" on storage.objects;
create policy "Public read studio-media"
  on storage.objects for select
  using (bucket_id = 'studio-media');

drop policy if exists "Admins upload studio-media" on storage.objects;
create policy "Admins upload studio-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'studio-media' and public.is_studio_admin());

drop policy if exists "Admins update studio-media" on storage.objects;
create policy "Admins update studio-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'studio-media' and public.is_studio_admin());

drop policy if exists "Admins delete studio-media" on storage.objects;
create policy "Admins delete studio-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'studio-media' and public.is_studio_admin());

-- ============================================================================
-- 15. Explicit Role Grants & PostgREST Schema Cache Reload
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

grant select on public.products, public.news, public.team_members, public.site_settings to anon, authenticated;
grant insert on public.support_tickets, public.suggestions, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_studio_admin(), public.is_super_or_admin() to anon, authenticated, service_role;

notify pgrst, 'reload schema';

