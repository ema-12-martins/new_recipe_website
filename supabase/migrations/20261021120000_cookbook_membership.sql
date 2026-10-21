-- Cookbook + membership boundary (D-28). One family cookbook per deployment.
-- Every later data table carries cookbook_id references cookbooks(id) on delete cascade.

create table public.cookbooks (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Family cookbook',
  created_at timestamptz not null default now()
);

-- Singleton: at most one cookbook row can ever exist.
create unique index cookbooks_singleton on public.cookbooks ((true));

create table public.memberships (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  email text not null,
  locale text not null default 'pt' check (locale in ('pt', 'en')),
  joined_at timestamptz not null default now()
);

create unique index memberships_one_owner on public.memberships (cookbook_id) where role = 'owner';
create index memberships_cookbook_id_idx on public.memberships (cookbook_id);

alter table public.cookbooks enable row level security;
alter table public.memberships enable row level security;

-- Explicit grants so behaviour does not depend on project default privileges.
-- Reads are filtered by RLS; there are no client write policies (writes go through
-- security-definer functions or the service role).
grant select on public.cookbooks, public.memberships to anon, authenticated;
grant all on public.cookbooks, public.memberships to service_role;

-- Helper functions. SECURITY DEFINER so policies can consult memberships without
-- recursive RLS evaluation; empty search_path forces fully qualified names.

create function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m where m.user_id = (select auth.uid())
  );
$$;

create function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

create function public.current_cookbook_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.cookbook_id from public.memberships m where m.user_id = (select auth.uid());
$$;

-- Lets the sign-in/setup pages decide whether owner setup is still open, without signing in.
create function public.cookbook_exists()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.cookbooks);
$$;

-- Creates the single cookbook and its owner membership. Service role only.
create function public.claim_owner(p_user_id uuid, p_email text, p_locale text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cookbook_id uuid;
begin
  begin
    insert into public.cookbooks default values returning id into v_cookbook_id;
  exception
    when unique_violation then
      raise exception 'cookbook_already_claimed';
  end;

  insert into public.memberships (user_id, cookbook_id, role, email, locale)
  values (p_user_id, v_cookbook_id, 'owner', p_email, p_locale);

  return v_cookbook_id;
end;
$$;

revoke execute on function public.is_member() from public;
revoke execute on function public.is_owner() from public;
revoke execute on function public.current_cookbook_id() from public;
revoke execute on function public.cookbook_exists() from public;
grant execute on function public.is_member() to anon, authenticated, service_role;
grant execute on function public.is_owner() to anon, authenticated, service_role;
grant execute on function public.current_cookbook_id() to anon, authenticated, service_role;
grant execute on function public.cookbook_exists() to anon, authenticated, service_role;

revoke execute on function public.claim_owner(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_owner(uuid, text, text) to service_role;

-- Policies: members see their cookbook; a member sees their own membership, the owner sees all.
create policy cookbooks_select_members
  on public.cookbooks
  for select
  to authenticated
  using (public.is_member());

create policy memberships_select_self_or_owner
  on public.memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_owner());
