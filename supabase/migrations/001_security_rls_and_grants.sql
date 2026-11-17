-- TAK1 Game Studio — Migration 001: Hardened Super Admin RLS, Role Grants & Storage Constraints
-- Safe & Idempotent: Preserves all existing tables and data. Never drops tables or deletes rows.
-- Execute in Supabase SQL Editor if upgrading an existing deployment.

-- 1. Strict Super Admin helper function (only active users with role = 'super_admin')
create or replace function public.is_super_admin()
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
      and a.role = 'super_admin'
      and (
        a.auth_user_id = auth.uid()
        or (
          auth.uid() is not null
          and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      )
  );
$$;

-- 2. Harden existing admin helper functions so JWT email fallback requires authenticated auth.uid()
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
        or (
          auth.uid() is not null
          and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
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
        or (
          auth.uid() is not null
          and lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
      )
  );
$$;

-- 3. Restrict admin_users mutations strictly to super_admin in RLS
drop policy if exists "Admins read admin_users" on public.admin_users;
create policy "Admins read admin_users"
  on public.admin_users for select
  to authenticated
  using (public.is_studio_admin());

drop policy if exists "Super admins manage admin_users" on public.admin_users;
create policy "Super admins manage admin_users"
  on public.admin_users for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 4. Ensure studio-media Storage bucket config enforces public read + 5MB image-only limits
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'studio-media',
  'studio-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 5. Role Grants & PostgREST Schema Cache Reload
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all routines in schema public to service_role;

grant select on public.products, public.news, public.team_members, public.site_settings to anon, authenticated;
grant insert on public.support_tickets, public.suggestions, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.is_studio_admin(), public.is_super_or_admin(), public.is_super_admin() to anon, authenticated, service_role;

notify pgrst, 'reload schema';
