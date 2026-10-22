-- One-time invite links (D-19, D-29). Only a SHA-256 hash of each token is stored; the plain
-- token exists only in the link shown once to the owner. No email is ever sent.

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  token_hash text not null unique,
  label text check (label is null or char_length(label) <= 80),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  used_at timestamptz,
  used_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz
);

create index invites_cookbook_id_created_at_idx on public.invites (cookbook_id, created_at desc);

alter table public.invites enable row level security;

-- Explicit privileges so behaviour does not depend on project default privileges.
-- Clients only create invites (the owner, under RLS); use and revocation go through
-- the security-definer functions below.
revoke all on public.invites from anon, authenticated;
grant select on public.invites to authenticated;
grant insert (cookbook_id, token_hash, label) on public.invites to authenticated;
grant all on public.invites to service_role;

create policy invites_select_owner
  on public.invites
  for select
  to authenticated
  using (public.is_owner());

create policy invites_insert_owner
  on public.invites
  for insert
  to authenticated
  with check (public.is_owner() and cookbook_id = public.current_cookbook_id());

-- Marks a usable invite as used and adds the new member, atomically. The single conditional
-- UPDATE is the race guard: of two concurrent redemptions only one matches a row.
-- Service role only; the server creates the auth user first and deletes it if this raises.
create function public.redeem_invite(p_token_hash text, p_user_id uuid, p_email text, p_locale text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cookbook_id uuid;
begin
  update public.invites
  set used_at = now(), used_by = p_user_id
  where token_hash = p_token_hash
    and used_at is null
    and revoked_at is null
    and expires_at > now()
  returning cookbook_id into v_cookbook_id;

  if v_cookbook_id is null then
    raise exception 'invite_invalid' using errcode = 'P0001';
  end if;

  insert into public.memberships (user_id, cookbook_id, role, email, locale)
  values (p_user_id, v_cookbook_id, 'member', p_email, p_locale);

  return v_cookbook_id;
end;
$$;

-- Owner-only revocation of an unused invite. Repeating it keeps the first revocation time.
create function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  update public.invites
  set revoked_at = coalesce(revoked_at, now())
  where id = p_invite_id
    and used_at is null
    and cookbook_id = public.current_cookbook_id();
end;
$$;

revoke execute on function public.redeem_invite(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.redeem_invite(text, uuid, text, text) to service_role;

revoke execute on function public.revoke_invite(uuid) from public, anon;
grant execute on function public.revoke_invite(uuid) to authenticated;
