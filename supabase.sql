-- CDMG Automation — Supabase schema (multi-tenant)
-- Run in Supabase SQL Editor (as a privileged role).

-- Extensions
create extension if not exists pgcrypto;

-- --- Core tables ---

create table if not exists public.platform_admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null check (plan in ('starter','growth','pro')),
  channels jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  type text not null,
  message text not null,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  created_at timestamptz not null default now()
);

create table if not exists public.workflow_instances (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (org_id, key)
);

-- --- Helper functions (RLS) ---

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.platform_admins pa
    where pa.email = (auth.jwt() ->> 'email')
  );
$$;

create or replace function public.is_org_member(check_org uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.memberships m
    where m.org_id = check_org
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.is_org_owner(check_org uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.memberships m
    where m.org_id = check_org
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- --- Triggers: auto-create profile on signup ---

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (user_id) do update
    set email = excluded.email,
        full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- --- Row Level Security ---

alter table public.platform_admins enable row level security;
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.requests enable row level security;
alter table public.workflow_instances enable row level security;

-- platform_admins
drop policy if exists "platform_admins_self_select" on public.platform_admins;
create policy "platform_admins_self_select"
on public.platform_admins
for select
to authenticated
using (email = (auth.jwt() ->> 'email'));

-- Writes to platform_admins should be managed via SQL/migrations, not from the client.

-- organizations
drop policy if exists "organizations_select" on public.organizations;
create policy "organizations_select"
on public.organizations
for select
to authenticated
using (public.is_platform_admin() or public.is_org_member(id));

drop policy if exists "organizations_admin_write" on public.organizations;
create policy "organizations_admin_write"
on public.organizations
for insert, update, delete
to authenticated
with check (public.is_platform_admin())
using (public.is_platform_admin());

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
on public.profiles
for select
to authenticated
using (public.is_platform_admin() or user_id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "profiles_admin_write" on public.profiles;
create policy "profiles_admin_write"
on public.profiles
for update, delete
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- memberships
drop policy if exists "memberships_select" on public.memberships;
create policy "memberships_select"
on public.memberships
for select
to authenticated
using (
  public.is_platform_admin()
  or user_id = auth.uid()
  or public.is_org_member(org_id)
);

drop policy if exists "memberships_admin_write" on public.memberships;
create policy "memberships_admin_write"
on public.memberships
for insert, update, delete
to authenticated
with check (public.is_platform_admin())
using (public.is_platform_admin());

-- requests
drop policy if exists "requests_select" on public.requests;
create policy "requests_select"
on public.requests
for select
to authenticated
using (public.is_platform_admin() or public.is_org_member(org_id));

drop policy if exists "requests_insert" on public.requests;
create policy "requests_insert"
on public.requests
for insert
to authenticated
with check (public.is_platform_admin() or public.is_org_member(org_id));

drop policy if exists "requests_admin_write" on public.requests;
create policy "requests_admin_write"
on public.requests
for update, delete
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- workflow_instances
drop policy if exists "workflow_instances_select" on public.workflow_instances;
create policy "workflow_instances_select"
on public.workflow_instances
for select
to authenticated
using (public.is_platform_admin() or public.is_org_member(org_id));

drop policy if exists "workflow_instances_admin_write" on public.workflow_instances;
create policy "workflow_instances_admin_write"
on public.workflow_instances
for insert, update, delete
to authenticated
using (public.is_platform_admin())
with check (public.is_platform_admin());

-- --- Seed platform admins (requested) ---
insert into public.platform_admins (email) values
  ('cdmgautomation1@gmail.com'),
  ('carlos.martinez@cdmgautomation.com')
on conflict (email) do nothing;

-- --- Helpful indexes ---
create index if not exists memberships_user_idx on public.memberships (user_id);
create index if not exists memberships_org_idx on public.memberships (org_id);
create index if not exists requests_org_idx on public.requests (org_id, created_at desc);
create index if not exists workflow_instances_org_idx on public.workflow_instances (org_id);
