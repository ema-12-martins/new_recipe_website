-- Recipe photos (CAPT-01, CAPT-04, RECP-02). Original handwritten-recipe photos live in a
-- private Storage bucket under {cookbook_id}/{recipe_id}/{photo_id}.jpg and are listed in
-- public.recipe_photos. Nothing here is public: members read through the application, and
-- every policy requires membership of the cookbook that owns the folder (D-24).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', false, 2097152, array['image/jpeg'])
on conflict (id) do nothing;

create table public.recipe_photos (
  id uuid primary key,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  cookbook_id uuid not null references public.cookbooks (id) on delete cascade,
  position smallint not null check (position between 1 and 6),
  object_path text not null unique,
  created_at timestamptz not null default now(),
  -- The path is derived from the ids, so a row can never point at another recipe's file.
  constraint recipe_photos_object_path_matches
    check (object_path = cookbook_id::text || '/' || recipe_id::text || '/' || id::text || '.jpg'),
  constraint recipe_photos_recipe_position_key
    unique (recipe_id, position) deferrable initially deferred
);

create index recipe_photos_recipe_id_idx on public.recipe_photos (recipe_id);

-- A recipe holds at most six photos (D-03).
create function public.limit_recipe_photos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.recipe_photos p where p.recipe_id = new.recipe_id) >= 6 then
    raise exception 'recipe_photo_limit' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger limit_recipe_photos
  before insert on public.recipe_photos
  for each row execute function public.limit_recipe_photos();

alter table public.recipe_photos enable row level security;

revoke all on public.recipe_photos from anon, authenticated;
grant select, insert, delete on public.recipe_photos to authenticated;
grant all on public.recipe_photos to service_role;

create policy recipe_photos_select_members
  on public.recipe_photos
  for select
  to authenticated
  using (public.is_member() and cookbook_id = public.current_cookbook_id());

create policy recipe_photos_insert_members
  on public.recipe_photos
  for insert
  to authenticated
  with check (
    public.is_member()
    and cookbook_id = public.current_cookbook_id()
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_photos.recipe_id and r.cookbook_id = recipe_photos.cookbook_id
    )
  );

create policy recipe_photos_delete_members
  on public.recipe_photos
  for delete
  to authenticated
  using (public.is_member() and cookbook_id = public.current_cookbook_id());

-- Storage objects: only members of the cookbook named by the first path segment.
create policy recipe_photos_objects_select
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'recipe-photos'
    and public.is_member()
    and (storage.foldername(name))[1] = public.current_cookbook_id()::text
  );

create policy recipe_photos_objects_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'recipe-photos'
    and public.is_member()
    and (storage.foldername(name))[1] = public.current_cookbook_id()::text
  );

create policy recipe_photos_objects_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'recipe-photos'
    and public.is_member()
    and (storage.foldername(name))[1] = public.current_cookbook_id()::text
  );
