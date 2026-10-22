-- Recipes (RECP-01, RECP-03). Text is stored exactly as typed (D-11): ingredient lines
-- (D-12) and ordered steps (D-13) live on the recipe row, so one UPDATE changes title,
-- ingredients and steps atomically. There is no delete path in Phase 1 (D-15).

-- True when every element is non-null and 1..max_len characters long.
create function public.text_lines_ok(arr text[], max_len integer)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_and(x is not null and char_length(x) between 1 and max_len), true)
  from unnest(arr) as x;
$$;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  title text not null
    check (char_length(title) between 1 and 300 and btrim(title) <> ''),
  ingredients text[] not null default '{}'
    check (cardinality(ingredients) <= 200 and public.text_lines_ok(ingredients, 500)),
  steps text[] not null default '{}'
    check (cardinality(steps) <= 100 and public.text_lines_ok(steps, 4000)),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_cookbook_id_title_idx on public.recipes (cookbook_id, title);

-- Optimistic concurrency: every successful update bumps the version, so a save based on a
-- stale version matches zero rows instead of overwriting someone else's edit.
create function public.bump_recipe_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger bump_recipe_version
  before update on public.recipes
  for each row execute function public.bump_recipe_version();

-- Private creator metadata (D-10, D-21): readable by the owner only, used by the later
-- member-removal review. Deleting an auth account anonymizes it and keeps the recipe (D-17).
create table public.recipe_creators (
  recipe_id uuid primary key references public.recipes (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null
);

create function public.set_recipe_creator()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.recipe_creators (recipe_id, created_by) values (new.id, auth.uid());
  return new;
end;
$$;

revoke execute on function public.set_recipe_creator() from public, anon, authenticated;

create trigger set_recipe_creator
  after insert on public.recipes
  for each row execute function public.set_recipe_creator();

alter table public.recipes enable row level security;
alter table public.recipe_creators enable row level security;

-- Explicit privileges so behaviour does not depend on project default privileges.
-- Clients may write only the content columns; id/cookbook_id are fixed after insert and
-- version/updated_at are maintained by the trigger. DELETE is granted but has no policy,
-- so RLS makes every client delete affect 0 rows (D-15).
revoke all on public.recipes from anon, authenticated;
grant select on public.recipes to anon, authenticated;
grant delete on public.recipes to authenticated;
grant insert (id, cookbook_id, title, ingredients, steps) on public.recipes to authenticated;
grant update (title, ingredients, steps) on public.recipes to authenticated;
grant all on public.recipes to service_role;

revoke all on public.recipe_creators from anon, authenticated;
grant select on public.recipe_creators to authenticated;
grant all on public.recipe_creators to service_role;

create policy recipes_select_members
  on public.recipes
  for select
  to authenticated
  using (public.is_member() and cookbook_id = public.current_cookbook_id());

create policy recipes_insert_members
  on public.recipes
  for insert
  to authenticated
  with check (public.is_member() and cookbook_id = public.current_cookbook_id());

create policy recipes_update_members
  on public.recipes
  for update
  to authenticated
  using (public.is_member() and cookbook_id = public.current_cookbook_id())
  with check (public.is_member() and cookbook_id = public.current_cookbook_id());

create policy recipe_creators_select_owner
  on public.recipe_creators
  for select
  to authenticated
  using (public.is_owner());
